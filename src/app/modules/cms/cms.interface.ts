// src/interfaces/cms.interface.ts

export interface ICMSPage {
  pageId?: number;
  pageTitle: string;
  urlKey: string;
  content: string;
  mainTitle: string;
  metaKeywords: string;
  metaDescription: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICMSPageCreate {
  pageTitle: string;
  urlKey: string;
  content: string;
  mainTitle: string;
  metaKeywords: string;
  metaDescription: string;
  isActive?: boolean;
}

export interface ICMSPageUpdate {
  pageTitle?: string;
  urlKey?: string;
  content?: string;
  mainTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
  isActive?: boolean;
}

export interface ICMSPageQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}