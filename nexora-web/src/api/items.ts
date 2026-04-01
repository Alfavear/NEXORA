import http from './http';

export const itemsApi = {
  async list() {
    return http.get('/items?isActive=true');
  },
  async create(data: any) {
    return http.post('/items', data);
  },
  async uploadImage(file: File) {
    const form = new FormData();
    form.append('file', file);
    return http.post('/items/upload', form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
