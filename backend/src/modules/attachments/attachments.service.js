import fs from 'fs';
import { attachmentsRepository } from './attachments.repository.js';
import prisma from '../../common/database/prisma.js';
import { NotFoundError, BadRequestError } from '../../common/errors/AppError.js';
import { AttachmentDto } from './attachments.dto.js';

export class AttachmentsService {
  async getAttachments(query) {
    const { page, limit, doctorId, fileType } = query;

    const { attachments, total } = await attachmentsRepository.findManyAndCount({
      page,
      limit,
      doctorId,
      fileType,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      attachments: AttachmentDto.array(attachments),
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async getAttachmentById(id) {
    const attachment = await attachmentsRepository.findById(id);
    if (!attachment) {
      throw new NotFoundError('Attachment not found.');
    }
    return new AttachmentDto(attachment);
  }

  async createAttachment(payload, file, user) {
    if (!file) {
      throw new BadRequestError('No file uploaded.');
    }

    let doctorId = payload.doctorId;

    if (user.role === 'DOCTOR') {
      doctorId = user.id;
    } else if (user.role === 'ADMIN') {
      if (!doctorId) {
        const docRecord = await prisma.doctor.findUnique({ where: { id: user.id } });
        if (docRecord) {
          doctorId = user.id;
        } else {
          throw new BadRequestError(
            'Admin must specify a doctorId in the payload to associate an attachment.'
          );
        }
      }
    }

    // Verify Doctor exists
    const doctorExists = await prisma.doctor.findFirst({
      where: { id: doctorId, deletedAt: null },
    });
    if (!doctorExists) {
      // Clean up uploaded file if database check fails
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch {
        // ignore
      }
      throw new NotFoundError('Doctor not found.');
    }

    const attachment = await attachmentsRepository.create({
      doctorId,
      fileName: file.originalname,
      filePath: file.path,
      fileType: payload.fileType,
      notes: payload.notes,
    });

    return new AttachmentDto(attachment);
  }

  async deleteAttachment(id) {
    const attachment = await attachmentsRepository.findById(id);
    if (!attachment) {
      throw new NotFoundError('Attachment not found.');
    }

    // Attempt physical deletion of file
    try {
      if (fs.existsSync(attachment.filePath)) {
        fs.unlinkSync(attachment.filePath);
      }
    } catch {
      // log and continue
    }

    await attachmentsRepository.delete(id);
  }
}

export const attachmentsService = new AttachmentsService();
