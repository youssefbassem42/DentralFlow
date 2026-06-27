import fs from 'fs';
import { attachmentsService } from './attachments.service.js';
import { attachmentsRepository } from './attachments.repository.js';
import { NotFoundError } from '../../common/errors/AppError.js';

export class AttachmentsController {
  getAttachments = async (req, res, next) => {
    try {
      const data = await attachmentsService.getAttachments(req.query);
      return res.status(200).json({
        success: true,
        message: 'Attachments retrieved successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  getAttachment = async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = await attachmentsService.getAttachmentById(id);
      return res.status(200).json({
        success: true,
        message: 'Attachment metadata retrieved successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  createAttachment = async (req, res, next) => {
    try {
      const user = req.user;
      const data = await attachmentsService.createAttachment(req.body, req.file, user);
      return res.status(201).json({
        success: true,
        message: 'Attachment uploaded successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  downloadAttachment = async (req, res, next) => {
    try {
      const { id } = req.params;
      const attachment = await attachmentsRepository.findById(id);
      if (!attachment) {
        throw new NotFoundError('Attachment not found.');
      }

      if (!fs.existsSync(attachment.filePath)) {
        throw new NotFoundError('Physical file not found on disk.');
      }

      return res.download(attachment.filePath, attachment.fileName);
    } catch (error) {
      return next(error);
    }
  };

  deleteAttachment = async (req, res, next) => {
    try {
      const { id } = req.params;
      await attachmentsService.deleteAttachment(id);
      return res.status(200).json({
        success: true,
        message: 'Attachment deleted successfully.',
        data: null,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };
}

export const attachmentsController = new AttachmentsController();
