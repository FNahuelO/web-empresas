'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { profileService } from '@/services/profileService';
import { EmpresaProfile } from '@/types';
import toast from 'react-hot-toast';

export default function ConfiguracionPage() {
  const [profile, setProfile] = useState<EmpresaProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    descripcion: '',
    sitioWeb: '',
    phone: '',
    ciudad: '',
    provincia: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await profileService.getEmpresaProfile();
      setProfile(data);
      setFormData({
        companyName: data.companyName || '',
        descripcion: data.descripcion || '',
        sitioWeb: data.sitioWeb || '',
        phone: data.phone || '',
        ciudad: data.ciudad || '',
        provincia: data.provincia || '',
      });
    } catch (error: any) {
      toast.error('Error al cargar perfil');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await profileService.updateEmpresaProfile(formData);
      toast.success('Perfil actualizado exitosamente');
      loadProfile();
    } catch (error: any) {
      toast.error('Error al actualizar perfil');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona la información de tu empresa
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Información de la Empresa</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  rows={4}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ciudad" className="block text-sm font-medium text-gray-700">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    id="ciudad"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="provincia" className="block text-sm font-medium text-gray-700">
                    Provincia
                  </label>
                  <input
                    type="text"
                    id="provincia"
                    value={formData.provincia}
                    onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sitioWeb" className="block text-sm font-medium text-gray-700">
                    Sitio Web
                  </label>
                  <input
                    type="url"
                    id="sitioWeb"
                    value={formData.sitioWeb}
                    onChange={(e) => setFormData({ ...formData, sitioWeb: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

