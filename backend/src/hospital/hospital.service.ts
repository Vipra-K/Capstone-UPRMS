import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class HospitalService {
    constructor(private readonly prisma: PrismaService) {}

    // ── List all hospitals (public) ──────────────────────────────────────────
    async findAll() {
        return this.prisma.hospital.findMany({
            select: { id: true, hospitalName: true, registrationNumber: true, slug: true },
            orderBy: { hospitalName: 'asc' },
        });
    }

    // ── Own profile ──────────────────────────────────────────────────────────
    async getProfile(userId: number) {
        const hospital = await this.prisma.hospital.findUnique({
            where: { userId },
            include: { user: { select: { phone: true } } },
        });
        if (!hospital) throw new NotFoundException('Hospital not found');

        return {
            id: hospital.id,
            hospitalName: hospital.hospitalName,
            registrationNumber: hospital.registrationNumber,
            slug: hospital.slug,
            address: hospital.address,
            city: hospital.city,
            phone: hospital.user.phone,
        };
    }

    // ── Update profile ───────────────────────────────────────────────────────
    async updateProfile(
        userId: number,
        dto: { phone?: string; address?: string; city?: string; hospitalPhone?: string },
    ) {
        await this.prisma.$transaction(async (tx) => {
            if (dto.phone) {
                await tx.user.update({ where: { id: userId }, data: { phone: dto.phone } });
            }
            const updateData: Prisma.HospitalUpdateInput = {};
            if (dto.address !== undefined) updateData.address = dto.address;
            if (dto.city !== undefined) updateData.city = dto.city;
            if (dto.hospitalPhone !== undefined) updateData.phone = dto.hospitalPhone;
            if (Object.keys(updateData).length > 0) {
                await tx.hospital.update({ where: { userId }, data: updateData });
            }
        });
        return { message: 'Profile updated successfully' };
    }

    // ── Dashboard stats (no N+1) ─────────────────────────────────────────────
    async getDashboardStats(userId: number) {
        const hospital = await this.prisma.hospital.findUnique({ where: { userId } });
        if (!hospital) throw new NotFoundException('Hospital not found');

        const hospitalId = hospital.id;

        const [totalPatients, totalRecords, recentUploads] = await this.prisma.$transaction([
            this.prisma.accessPermission.count({
                where: { hospitalId, status: 'APPROVED' },
            }),
            this.prisma.medicalRecord.count({ where: { hospitalId } }),
            this.prisma.medicalRecord.findMany({
                where: { hospitalId },
                include: { patient: { select: { fullName: true } } },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
        ]);

        const recentActivity = recentUploads.map((r) => ({
            id: r.id,
            type: 'UPLOAD',
            patientName: r.patient.fullName,
            date: r.createdAt,
            diagnosis: r.diagnosis,
        }));

        return { totalPatients, totalRecords, recentActivity };
    }

    // ── Get authorized patients ─────────────────────────────────────────────
    async getPatients(userId: number) {
        const hospital = await this.prisma.hospital.findUnique({ where: { userId } });
        if (!hospital) throw new NotFoundException('Hospital not found');

        const hospitalId = hospital.id;

        const authorizedPatients = await this.prisma.accessPermission.findMany({
            where: { hospitalId, status: 'APPROVED' },
            include: {
                patient: {
                    select: {
                        id: true,
                        fullName: true,
                        dateOfBirth: true,
                        gender: true,
                        user: { select: { phone: true } },
                        assignments: {
                            select: {
                                isEmergency: true,
                                doctor: {
                                    select: {
                                        fullName: true,
                                        specialization: true,
                                        hospitalId: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { patient: { fullName: 'asc' } },
        });

        return authorizedPatients.map((ap) => {
            const assignment = ap.patient.assignments[0]; // strictly one because of @unique patientId
            return {
                id: ap.patient.id,
                fullName: ap.patient.fullName,
                dateOfBirth: ap.patient.dateOfBirth,
                gender: ap.patient.gender,
                phone: ap.patient.user.phone,
                grantedAt: ap.updatedAt,
                assignedDoctor: assignment ? {
                    fullName: assignment.doctor.fullName,
                    specialization: assignment.doctor.specialization,
                    isEmergency: assignment.isEmergency,
                    isSameHospital: assignment.doctor.hospitalId === hospitalId,
                } : null,
            };
        });
    }

    // ── Register patient (by hospital, auto temp password) ───────────────────
    async registerPatient(
        hospitalUserId: number,
        dto: {
            fullName: string;
            phone: string;
            aadhaarNumber: string;
            dateOfBirth: string;
            gender: string;
        },
    ) {
        const hospital = await this.prisma.hospital.findUnique({ where: { userId: hospitalUserId } });
        if (!hospital) throw new NotFoundException('Hospital not found');

        const namePart = dto.fullName.replace(/\s+/g, '').slice(0, 4).toLowerCase();
        const phonePart = dto.phone.slice(-4);
        const tempPassword = `${namePart}@${phonePart}`;
        const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        phone: dto.phone,
                        aadhaarNumber: dto.aadhaarNumber,
                        passwordHash,
                        role: 'PATIENT',
                        patient: {
                            create: {
                                fullName: dto.fullName,
                                dateOfBirth: dto.dateOfBirth,
                                gender: dto.gender,
                            },
                        },
                    },
                    select: { id: true, patient: { select: { id: true } } },
                });
                return user;
            });

            return {
                message: 'Patient registered successfully',
                patientId: result.patient?.id,
                userId: result.id,
                fullName: dto.fullName,
                phone: dto.phone,
                tempPassword,
            };
        } catch (e: any) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                const target = (e.meta?.target as string[] | undefined)?.join(', ') ?? '';
                if (target.includes('phone')) throw new ConflictException('Phone number is already registered');
                if (target.includes('aadhaar')) throw new ConflictException('Aadhaar number is already registered');
            }
            throw e;
        }
    }

    // ── Hospital audit log (all uploads) ────────────────────────────────────
    async getAuditLog(userId: number) {
        const hospital = await this.prisma.hospital.findUnique({ where: { userId } });
        if (!hospital) throw new NotFoundException('Hospital not found');

        return this.prisma.medicalRecord.findMany({
            where: { hospitalId: hospital.id },
            include: { patient: { select: { fullName: true, id: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
}
