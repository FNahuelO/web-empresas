'use client';

import { useEffect, useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { profileService } from '@/services/profileService';
import { httpClient } from '@/lib/httpClient';
import { API_ENDPOINTS } from '@/lib/api';
import { EmpresaProfile } from '@/types';
import toast from 'react-hot-toast';
import argentinaLocationsData from '@/data/argentina-locations.json';

interface Province {
  id: string;
  code: string;
  name: string;
}

interface Locality {
  id: string;
  name: string;
  provinceId: string;
  provinceName: string;
  municipalityId?: string;
  municipalityName?: string;
}

interface SelectOption {
  value: string;
  label: string;
}

export default function ConfiguracionPage() {
  const [profile, setProfile] = useState<EmpresaProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [sectorOptions, setSectorOptions] = useState<SelectOption[]>([]);
  const [industriaOptions, setIndustriaOptions] = useState<SelectOption[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [formData, setFormData] = useState({
    companyName: '',
    descripcion: '',
    sitioWeb: '',
    phone: '',
    email: '',
    ciudad: '',
    provincia: '',
    pais: '',
    sector: '',
    industria: '',
  });

  // Provincias ordenadas alfabéticamente
  const provinces = useMemo(() => {
    return [...(argentinaLocationsData.provinces as Province[])].sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );
  }, []);

  // Localidades filtradas por provincia seleccionada
  const localities = useMemo(() => {
    if (!formData.provincia) return [];
    const province = (argentinaLocationsData.provinces as Province[]).find(
      (p) => p.name === formData.provincia
    );
    if (!province) return [];
    return (argentinaLocationsData.localities as Locality[])
      .filter(
        (loc) =>
          loc.provinceId === province.id ||
          loc.provinceName === province.name
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  }, [formData.provincia]);

  // Cargar catálogos del backend (sectores e industrias)
  const loadCatalogs = async () => {
    try {
      setLoadingCatalogs(true);
      const response = await httpClient.get<{
        data: {
          sectors?: Array<{ code: string; label: string }>;
          jobAreas?: Array<{ code: string; label: string }>;
        };
      }>(API_ENDPOINTS.CATALOGS.GET('es'));
      const data = response.data;
      // Industria usa "sectors" del backend (igual que mobile)
      if (data.sectors) {
        setIndustriaOptions(
          data.sectors.map((s) => ({ value: s.code, label: s.label }))
        );
      }
      // Sector usa "jobAreas" del backend (igual que mobile)
      if (data.jobAreas) {
        setSectorOptions(
          data.jobAreas.map((a) => ({ value: a.code, label: a.label }))
        );
      }
    } catch (error) {
      console.error('Error cargando catálogos:', error);
    } finally {
      setLoadingCatalogs(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadCatalogs();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await profileService.getEmpresaProfile();
      setProfile(data);
      syncFormData(data);
    } catch (error: any) {
      toast.error('Error al cargar perfil');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const syncFormData = (data: EmpresaProfile) => {
    setFormData({
      companyName: data.companyName || '',
      descripcion: data.descripcion || '',
      sitioWeb: data.sitioWeb || '',
      phone: data.phone || '',
      email: data.email || '',
      ciudad: data.ciudad || '',
      provincia: data.provincia || '',
      pais: data.pais || 'Argentina',
      sector: data.sector || '',
      industria: data.industria || '',
    });
  };

  const handleCancel = () => {
    if (profile) syncFormData(profile);
    setEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await profileService.updateEmpresaProfile(formData);
      setProfile(updated);
      syncFormData(updated);
      toast.success('Perfil actualizado exitosamente');
      setEditing(false);
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

  // Buscar el label legible para un código de catálogo
  const getCatalogLabel = (code: string | undefined, options: SelectOption[]) => {
    if (!code) return undefined;
    const option = options.find((o) => o.value === code);
    return option ? option.label : code;
  };

  const fieldLabel = (label: string, value?: string) => (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value || '—'}</dd>
    </div>
  );

  return (
    <Layout>
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Configuración</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestiona la información de tu empresa
            </p>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#002D5A] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#02345fb6] transition-colors sm:w-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Editar Perfil
            </button>
          )}
        </div>

        {/* Logo + nombre */}
        <div className="mb-6 flex items-center gap-4 rounded-lg bg-white p-4 shadow sm:p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-700">
            {profile?.logo ? (
              <img
                src={profile.logo}
                alt={profile.companyName}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              profile?.companyName?.charAt(0)?.toUpperCase() || 'E'
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {profile?.companyName || 'Sin nombre'}
            </h2>
            {profile?.email && (
              <p className="text-sm text-gray-500">{profile.email}</p>
            )}
          </div>
        </div>

        {/* Modo lectura */}
        {!editing && profile && (
          <div className="space-y-6">
            {/* Información general */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Información General</h3>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                {fieldLabel('Nombre de la Empresa', profile.companyName)}
                {fieldLabel('Email', profile.email)}
                {fieldLabel('Teléfono', profile.phone)}
                {fieldLabel('Sitio Web', profile.sitioWeb)}
              </dl>
            </div>

            {/* Descripción */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Descripción</h3>
              <p className="text-sm text-gray-900 whitespace-pre-line">
                {profile.descripcion || '—'}
              </p>
            </div>

            {/* Ubicación */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Ubicación</h3>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
                {fieldLabel('Ciudad', profile.ciudad)}
                {fieldLabel('Provincia', profile.provincia)}
                {fieldLabel('País', profile.pais)}
              </dl>
            </div>

            {/* Sector e Industria */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Sector e Industria</h3>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                {fieldLabel('Sector', getCatalogLabel(profile.sector, sectorOptions))}
                {fieldLabel('Industria', getCatalogLabel(profile.industria, industriaOptions))}
              </dl>
            </div>
          </div>
        )}

        {/* Modo edición */}
        {editing && (
          <form onSubmit={handleSubmit} className="space-y-6 text-black">
            {/* Información general */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Información General</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
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
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    disabled
                    className="mt-1 block w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-gray-500 shadow-sm cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-400">El email no puede ser modificado</p>
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

                <div className="sm:col-span-2">
                  <label htmlFor="sitioWeb" className="block text-sm font-medium text-gray-700">
                    Sitio Web
                  </label>
                  <input
                    type="url"
                    id="sitioWeb"
                    value={formData.sitioWeb}
                    onChange={(e) => setFormData({ ...formData, sitioWeb: e.target.value })}
                    placeholder="https://"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Descripción</h3>
              <textarea
                id="descripcion"
                rows={5}
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Describe tu empresa, su misión, visión y valores..."
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              />
            </div>

            {/* Ubicación */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Ubicación</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="provincia" className="block text-sm font-medium text-gray-700">
                    Provincia
                  </label>
                  <select
                    id="provincia"
                    value={formData.provincia}
                    onChange={(e) =>
                      setFormData({ ...formData, provincia: e.target.value, ciudad: '' })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 bg-white"
                  >
                    <option value="">Seleccionar provincia</option>
                    {provinces.map((prov) => (
                      <option key={prov.id} value={prov.name}>
                        {prov.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="ciudad" className="block text-sm font-medium text-gray-700">
                    Ciudad / Localidad
                  </label>
                  <select
                    id="ciudad"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    disabled={!formData.provincia}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {formData.provincia
                        ? 'Seleccionar localidad'
                        : 'Primero seleccioná una provincia'}
                    </option>
                    {localities.map((loc) => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="pais" className="block text-sm font-medium text-gray-700">
                    País
                  </label>
                  <input
                    type="text"
                    id="pais"
                    value={formData.pais}
                    disabled
                    className="mt-1 block w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-gray-500 shadow-sm cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Sector e Industria */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Sector e Industria</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="sector" className="block text-sm font-medium text-gray-700">
                    Sector
                  </label>
                  <select
                    id="sector"
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    disabled={loadingCatalogs}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {loadingCatalogs ? 'Cargando...' : 'Seleccionar sector'}
                    </option>
                    {sectorOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="industria" className="block text-sm font-medium text-gray-700">
                    Industria / Rubro
                  </label>
                  <select
                    id="industria"
                    value={formData.industria}
                    onChange={(e) => setFormData({ ...formData, industria: e.target.value })}
                    disabled={loadingCatalogs}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {loadingCatalogs ? 'Cargando...' : 'Seleccionar industria'}
                    </option>
                    {industriaOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
