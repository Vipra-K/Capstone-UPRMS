import { Controller, Get, Post, Patch, Body, Request, UseGuards } from '@nestjs/common';
import { HospitalService } from './hospital.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hospitals')
export class HospitalController {
    constructor(private readonly hospitalService: HospitalService) {}

    @Get()
    findAll() {
        return this.hospitalService.findAll();
    }

    @Get('profile')
    @Roles('HOSPITAL')
    getProfile(@Request() req) {
        return this.hospitalService.getProfile(req.user.userId);
    }

    @Patch('profile')
    @Roles('HOSPITAL')
    updateProfile(@Request() req, @Body() body: { phone?: string; address?: string; city?: string; hospitalPhone?: string }) {
        return this.hospitalService.updateProfile(req.user.userId, body);
    }

    @Get('stats')
    @Roles('HOSPITAL')
    getDashboardStats(@Request() req) {
        return this.hospitalService.getDashboardStats(req.user.userId);
    }

    @Get('audit')
    @Roles('HOSPITAL')
    getAuditLog(@Request() req) {
        return this.hospitalService.getAuditLog(req.user.userId);
    }

    @Get('patients')
    @Roles('HOSPITAL')
    getPatients(@Request() req) {
        return this.hospitalService.getPatients(req.user.userId);
    }

    @Post('patients')
    @Roles('HOSPITAL')
    registerPatient(
        @Request() req,
        @Body()
        dto: {
            fullName: string;
            phone: string;
            aadhaarNumber: string;
            dateOfBirth: string;
            gender: string;
        },
    ) {
        return this.hospitalService.registerPatient(req.user.userId, dto);
    }
}
