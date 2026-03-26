import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadRecordDto {
    @IsNotEmpty()
    @Type(() => Number)
    patientId: number;

    @IsNotEmpty()
    @IsString()
    diagnosis: string;

    @IsOptional()
    @IsString()
    prescription: string;

    @IsNotEmpty()
    @IsString()
    visitDate: string;
}
