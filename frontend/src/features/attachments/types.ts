export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  user?: {
    name: string;
  };
}

export interface Attachment {
  id: string;
  doctorId: string;
  fileName: string;
  filePath: string;
  fileType: 'X_Ray' | 'Prescription' | 'Images';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  doctor?: Doctor;
}

export interface AttachmentFilters {
  page?: number;
  limit?: number;
  doctorId?: string;
  fileType?: 'X_Ray' | 'Prescription' | 'Images';
}

export interface AttachmentsResponse {
  success: boolean;
  message: string;
  data: {
    attachments: Attachment[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}
