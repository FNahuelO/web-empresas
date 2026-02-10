'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import { httpClient } from '@/lib/httpClient';
import { API_ENDPOINTS } from '@/lib/api';

// ── Tipos ──────────────────────────────────────────────────────

interface SelectOption {
    value: string;
    label: string;
}

interface Province {
    id: string;
    code: string;
    name: string;
}

// ── Constantes ─────────────────────────────────────────────────

const CONDICIONES_FISCALES = [
    'Responsable Inscripto',
    'Monotributista',
    'Exento',
    'No Responsable',
];

const STEPS = [
    { title: 'Datos de la empresa', icon: '🏢' },
    { title: 'Ubicación y contacto', icon: '📍' },
    { title: 'Datos del usuario', icon: '👤' },
];

// ── Helpers ────────────────────────────────────────────────────

function parseFriendlyError(message: unknown): string {
    const fallback = 'Error al registrarse';
    if (!message) return fallback;

    const raw = Array.isArray(message) ? message[0] : String(message);
    if (!raw) return fallback;

    const friendlyMessages: Record<string, string> = {
        'validation.isEmail': 'Ingresá un email válido',
        'validation.isNotEmpty': 'Completá todos los campos obligatorios',
        'validation.isString': 'El valor ingresado no es válido',
        'validation.minLength': 'La contraseña debe tener al menos 8 caracteres',
        'validation.maxLength': 'El valor ingresado es demasiado largo',
        'validation.isBoolean': 'Valor no válido',
    };

    const key = raw.split('|')[0];
    return friendlyMessages[key] || raw || fallback;
}

// ── Componentes reutilizables ──────────────────────────────────

function FormField({
    label,
    required = false,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="block text-sm text-gray-600 mb-1">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            {children}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}

function InputField({
    label,
    required = false,
    error,
    type = 'text',
    ...props
}: {
    label: string;
    required?: boolean;
    error?: string;
    type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <FormField label={label} required={required} error={error}>
            <input
                type={type}
                className={`block w-full rounded-lg border ${error ? 'border-red-300' : 'border-gray-300'
                    } px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm transition-colors`}
                {...props}
            />
        </FormField>
    );
}

function SelectField({
    label,
    required = false,
    error,
    options,
    loading = false,
    placeholder,
    ...props
}: {
    label: string;
    required?: boolean;
    error?: string;
    options: SelectOption[] | string[];
    loading?: boolean;
    placeholder?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <FormField label={label} required={required} error={error}>
            <select
                className={`block w-full rounded-lg border ${error ? 'border-red-300' : 'border-gray-300'
                    } px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm bg-white transition-colors`}
                disabled={loading}
                {...props}
            >
                <option value="">
                    {loading ? 'Cargando...' : placeholder || 'Seleccionar...'}
                </option>
                {options.map((opt) => {
                    const value = typeof opt === 'string' ? opt : opt.value;
                    const label = typeof opt === 'string' ? opt : opt.label;
                    return (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    );
                })}
            </select>
        </FormField>
    );
}

// ── Componente principal ───────────────────────────────────────

export default function RegistroPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Opciones dinámicas
    const [industrias, setIndustrias] = useState<SelectOption[]>([]);
    const [loadingIndustrias, setLoadingIndustrias] = useState(true);
    const [cantidadEmpleados, setCantidadEmpleados] = useState<SelectOption[]>([]);
    const [loadingCantidad, setLoadingCantidad] = useState(true);
    const [provincias, setProvincias] = useState<Province[]>([]);
    const [localidades, setLocalidades] = useState<SelectOption[]>([]);
    const [loadingLocalidades, setLoadingLocalidades] = useState(false);

    // Estado del formulario
    const [form, setForm] = useState({
        // Empresa
        companyName: '',
        razonSocial: '',
        condicionFiscal: '',
        documento: '',
        cuit: '',
        // Ubicación y contacto
        provincia: '',
        localidad: '',
        calle: '',
        numero: '',
        codigoPostal: '',
        phoneCountryCode: '+54',
        telefono: '',
        industria: '',
        cantidadEmpleados: '',
        contribuyenteIngresosBrutos: false,
        // Usuario
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        passwordConfirm: '',
        aceptaTerminos: false,
    });

    const updateField = (field: string, value: string | boolean) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        // Limpiar error del campo al editar
        if (errors[field]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    // ── Carga de datos ─────────────────────────────────────────────

    // Cargar provincias desde JSON local
    useEffect(() => {
        const loadProvincias = async () => {
            try {
                const response = await fetch('/api/locations/provinces');
                if (!response.ok) {
                    // Fallback: cargar del JSON estático
                    const jsonModule = await import('@/data/argentina-locations.json');
                    const sorted = [...jsonModule.provinces].sort((a, b) =>
                        a.name.localeCompare(b.name)
                    );
                    setProvincias(sorted);
                    return;
                }
                const data = await response.json();
                setProvincias(data);
            } catch {
                // Fallback: cargar del JSON estático
                try {
                    const jsonModule = await import('@/data/argentina-locations.json');
                    const sorted = [...jsonModule.provinces].sort((a, b) =>
                        a.name.localeCompare(b.name)
                    );
                    setProvincias(sorted);
                } catch {
                    setProvincias([]);
                }
            }
        };
        loadProvincias();
    }, []);

    // Cargar sectores/industrias
    useEffect(() => {
        const loadIndustrias = async () => {
            try {
                setLoadingIndustrias(true);
                const res = await httpClient.get<{ data: SelectOption[] }>(
                    API_ENDPOINTS.OPTIONS.GET('sectors', 'es')
                );
                setIndustrias(res.data || []);
            } catch {
                setIndustrias([]);
            } finally {
                setLoadingIndustrias(false);
            }
        };
        loadIndustrias();
    }, []);

    // Cargar cantidad de empleados
    useEffect(() => {
        const loadCantidad = async () => {
            try {
                setLoadingCantidad(true);
                const res = await httpClient.get<{ data: SelectOption[] }>(
                    API_ENDPOINTS.OPTIONS.GET('companySizes', 'es')
                );
                setCantidadEmpleados(res.data || []);
            } catch {
                setCantidadEmpleados([]);
            } finally {
                setLoadingCantidad(false);
            }
        };
        loadCantidad();
    }, []);

    // Cargar localidades cuando cambia la provincia
    useEffect(() => {
        const loadLocalidades = async () => {
            if (!form.provincia) {
                setLocalidades([]);
                return;
            }

            const prov = provincias.find((p) => p.name === form.provincia);
            if (!prov) return;

            try {
                setLoadingLocalidades(true);
                const res = await fetch(
                    `https://apis.datos.gob.ar/georef/api/localidades?provincia=${prov.id}&campos=nombre&max=1000&orden=nombre`
                );
                const data = await res.json();
                const opts: SelectOption[] = (data.localidades || []).map(
                    (l: { nombre: string }) => ({
                        value: l.nombre,
                        label: l.nombre,
                    })
                );
                setLocalidades(opts);
            } catch {
                setLocalidades([]);
            } finally {
                setLoadingLocalidades(false);
            }
        };

        loadLocalidades();
        // Limpiar localidad cuando cambia provincia
        if (form.localidad) {
            updateField('localidad', '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.provincia, provincias]);

    // ── Validación por paso ────────────────────────────────────────

    const validateStep = useCallback(
        (step: number): boolean => {
            const newErrors: Record<string, string> = {};

            if (step === 0) {
                if (!form.companyName.trim()) newErrors.companyName = 'El nombre de la empresa es obligatorio';
                if (!form.razonSocial.trim()) newErrors.razonSocial = 'La razón social es obligatoria';
                if (!form.condicionFiscal) newErrors.condicionFiscal = 'Seleccioná una condición fiscal';
                if (!form.documento.trim()) newErrors.documento = 'El documento es obligatorio';
            }

            if (step === 1) {
                if (!form.provincia) newErrors.provincia = 'Seleccioná una provincia';
                if (!form.localidad) newErrors.localidad = 'Seleccioná una localidad';
                if (!form.calle.trim()) newErrors.calle = 'La calle es obligatoria';
                if (!form.numero.trim()) newErrors.numero = 'El número es obligatorio';
                if (!form.codigoPostal.trim()) newErrors.codigoPostal = 'El código postal es obligatorio';
                if (!form.telefono.trim()) newErrors.telefono = 'El teléfono es obligatorio';
                if (!form.industria) newErrors.industria = 'Seleccioná una industria';
                if (!form.cantidadEmpleados) newErrors.cantidadEmpleados = 'Seleccioná la cantidad de empleados';
            }

            if (step === 2) {
                if (!form.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
                if (!form.apellido.trim()) newErrors.apellido = 'El apellido es obligatorio';
                if (!form.email.trim()) {
                    newErrors.email = 'El email es obligatorio';
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
                    newErrors.email = 'Ingresá un email válido';
                }
                if (!form.password) {
                    newErrors.password = 'La contraseña es obligatoria';
                } else if (form.password.length < 8) {
                    newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
                }
                if (!form.passwordConfirm) {
                    newErrors.passwordConfirm = 'Confirmá la contraseña';
                } else if (form.password !== form.passwordConfirm) {
                    newErrors.passwordConfirm = 'Las contraseñas no coinciden';
                }
                if (!form.aceptaTerminos) {
                    newErrors.aceptaTerminos = 'Debés aceptar los términos y condiciones';
                }
            }

            setErrors(newErrors);
            return Object.keys(newErrors).length === 0;
        },
        [form]
    );

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
        }
    };

    const handleBack = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    };

    // ── Envío del formulario ───────────────────────────────────────

    const handleSubmit = async () => {
        if (!validateStep(2)) return;

        setIsLoading(true);
        try {
            await httpClient.post(API_ENDPOINTS.AUTH.REGISTER_EMPRESA, {
                companyName: form.companyName.trim(),
                razonSocial: form.razonSocial.trim(),
                condicionFiscal: form.condicionFiscal.trim(),
                documento: form.documento.trim(),
                ...(form.cuit && { cuit: form.cuit.trim() }),
                provincia: form.provincia.trim(),
                localidad: form.localidad.trim(),
                ciudad: form.localidad.trim(),
                calle: form.calle.trim(),
                numero: form.numero.trim(),
                codigoPostal: form.codigoPostal.trim(),
                phoneCountryCode: form.phoneCountryCode.trim(),
                telefono: form.telefono.trim(),
                industria: form.industria.trim(),
                cantidadEmpleados: form.cantidadEmpleados.trim(),
                contribuyenteIngresosBrutos: form.contribuyenteIngresosBrutos,
                nombre: form.nombre.trim(),
                apellido: form.apellido.trim(),
                email: form.email.trim(),
                password: form.password,
                passwordConfirm: form.passwordConfirm,
                aceptaTerminos: form.aceptaTerminos,
            });

            toast.success(
                'Registro exitoso. Revisá tu email para verificar tu cuenta.',
                { duration: 6000 }
            );
            router.push('/login');
        } catch (error: any) {
            const status = error?.response?.status;
            const apiMessage = error?.response?.data?.message;

            if (status === 400 || status === 401) {
                toast.error(typeof apiMessage === 'string' ? apiMessage : parseFriendlyError(apiMessage));
            } else {
                toast.error(parseFriendlyError(apiMessage));
            }
        } finally {
            setIsLoading(false);
        }
    };

    // ── Render de cada paso ────────────────────────────────────────

    const renderStep0 = () => (
        <div className="space-y-4">
            <div className="mb-2">
                <h3 className="text-lg font-semibold text-secondary-900">Información de la empresa</h3>
                <p className="text-sm text-gray-500">Completá los datos principales de tu empresa</p>
            </div>

            <InputField
                label="Nombre de la empresa"
                required
                placeholder="Ej: Mi Empresa SA"
                value={form.companyName}
                onChange={(e) => updateField('companyName', e.target.value)}
                error={errors.companyName}
            />

            <InputField
                label="Razón social"
                required
                placeholder="Ej: Mi Empresa Sociedad Anónima"
                value={form.razonSocial}
                onChange={(e) => updateField('razonSocial', e.target.value)}
                error={errors.razonSocial}
            />

            <SelectField
                label="Condición fiscal"
                required
                placeholder="Seleccionar condición fiscal"
                options={CONDICIONES_FISCALES}
                value={form.condicionFiscal}
                onChange={(e) => updateField('condicionFiscal', e.target.value)}
                error={errors.condicionFiscal}
            />

            <InputField
                label="Documento / DNI"
                required
                placeholder="Ej: 20345678"
                value={form.documento}
                onChange={(e) => updateField('documento', e.target.value)}
                error={errors.documento}
                inputMode="numeric"
            />

            <InputField
                label="CUIT"
                placeholder="Ej: 20-20345678-9 (opcional)"
                value={form.cuit}
                onChange={(e) => updateField('cuit', e.target.value)}
                error={errors.cuit}
            />
        </div>
    );

    const renderStep1 = () => (
        <div className="space-y-4">
            <div className="mb-2">
                <h3 className="text-lg font-semibold text-secondary-900">Ubicación y contacto</h3>
                <p className="text-sm text-gray-500">Dirección y datos de contacto de la empresa</p>
            </div>

            <SelectField
                label="Provincia"
                required
                placeholder="Seleccionar provincia"
                options={provincias.map((p) => ({ value: p.name, label: p.name }))}
                value={form.provincia}
                onChange={(e) => updateField('provincia', e.target.value)}
                error={errors.provincia}
            />

            <SelectField
                label="Localidad"
                required
                placeholder={
                    loadingLocalidades
                        ? 'Cargando localidades...'
                        : form.provincia
                            ? 'Seleccionar localidad'
                            : 'Primero seleccioná una provincia'
                }
                options={localidades}
                value={form.localidad}
                onChange={(e) => updateField('localidad', e.target.value)}
                error={errors.localidad}
                loading={loadingLocalidades}
                disabled={!form.provincia || loadingLocalidades}
            />

            <div className="grid grid-cols-2 gap-3">
                <InputField
                    label="Calle"
                    required
                    placeholder="Ej: Av. Corrientes"
                    value={form.calle}
                    onChange={(e) => updateField('calle', e.target.value)}
                    error={errors.calle}
                />
                <div className="grid grid-cols-2 gap-3">
                    <InputField
                        label="Número"
                        required
                        placeholder="1234"
                        value={form.numero}
                        onChange={(e) => updateField('numero', e.target.value)}
                        error={errors.numero}
                        inputMode="numeric"
                    />
                    <InputField
                        label="C.P."
                        required
                        placeholder="C1000"
                        value={form.codigoPostal}
                        onChange={(e) => updateField('codigoPostal', e.target.value)}
                        error={errors.codigoPostal}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm text-gray-600 mb-1">
                    Teléfono <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                    <select
                        className="w-24 rounded-lg border border-gray-300 px-2 py-2.5 text-sm text-gray-900 bg-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        value={form.phoneCountryCode}
                        onChange={(e) => updateField('phoneCountryCode', e.target.value)}
                    >
                        <option value="+54">🇦🇷 +54</option>
                        <option value="+55">🇧🇷 +55</option>
                        <option value="+56">🇨🇱 +56</option>
                        <option value="+598">🇺🇾 +598</option>
                        <option value="+595">🇵🇾 +595</option>
                        <option value="+591">🇧🇴 +591</option>
                        <option value="+1">🇺🇸 +1</option>
                    </select>
                    <input
                        type="tel"
                        className={`flex-1 rounded-lg border ${errors.telefono ? 'border-red-300' : 'border-gray-300'
                            } px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm`}
                        placeholder="Ej: 1123456789"
                        value={form.telefono}
                        onChange={(e) => updateField('telefono', e.target.value)}
                    />
                </div>
                {errors.telefono && (
                    <p className="text-xs text-red-500 mt-1">{errors.telefono}</p>
                )}
            </div>

            <SelectField
                label="Industria / Sector"
                required
                placeholder={loadingIndustrias ? 'Cargando sectores...' : 'Seleccionar industria'}
                options={industrias}
                value={form.industria}
                onChange={(e) => updateField('industria', e.target.value)}
                error={errors.industria}
                loading={loadingIndustrias}
            />

            <SelectField
                label="Cantidad de empleados"
                required
                placeholder={loadingCantidad ? 'Cargando...' : 'Seleccionar cantidad'}
                options={cantidadEmpleados}
                value={form.cantidadEmpleados}
                onChange={(e) => updateField('cantidadEmpleados', e.target.value)}
                error={errors.cantidadEmpleados}
                loading={loadingCantidad}
            />

            <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-700">Contribuyente de Ingresos Brutos</span>
                <button
                    type="button"
                    role="switch"
                    aria-checked={form.contribuyenteIngresosBrutos}
                    onClick={() =>
                        updateField('contribuyenteIngresosBrutos', !form.contribuyenteIngresosBrutos)
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.contribuyenteIngresosBrutos ? 'bg-secondary-900' : 'bg-gray-300'
                        }`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.contribuyenteIngresosBrutos ? 'translate-x-6' : 'translate-x-1'
                            }`}
                    />
                </button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-4">
            <div className="mb-2">
                <h3 className="text-lg font-semibold text-secondary-900">Datos del responsable</h3>
                <p className="text-sm text-gray-500">Información de la persona que administrará la cuenta</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <InputField
                    label="Nombre"
                    required
                    placeholder="Ej: Juan"
                    value={form.nombre}
                    onChange={(e) => updateField('nombre', e.target.value)}
                    error={errors.nombre}
                />
                <InputField
                    label="Apellido"
                    required
                    placeholder="Ej: Pérez"
                    value={form.apellido}
                    onChange={(e) => updateField('apellido', e.target.value)}
                    error={errors.apellido}
                />
            </div>

            <InputField
                label="Email"
                required
                type="email"
                placeholder="contacto@miempresa.com"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                error={errors.email}
                autoComplete="email"
            />

            <div>
                <label className="block text-sm text-gray-600 mb-1">
                    Contraseña <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        className={`block w-full rounded-lg border ${errors.password ? 'border-red-300' : 'border-gray-300'
                            } px-4 py-2.5 pr-10 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm`}
                        placeholder="Mínimo 8 caracteres"
                        value={form.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        autoComplete="new-password"
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                    >
                        {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        )}
                    </button>
                </div>
                {errors.password && (
                    <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                )}
            </div>

            <div>
                <label className="block text-sm text-gray-600 mb-1">
                    Confirmar contraseña <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                    <input
                        type={showPasswordConfirm ? 'text' : 'password'}
                        className={`block w-full rounded-lg border ${errors.passwordConfirm ? 'border-red-300' : 'border-gray-300'
                            } px-4 py-2.5 pr-10 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm`}
                        placeholder="Repetir contraseña"
                        value={form.passwordConfirm}
                        onChange={(e) => updateField('passwordConfirm', e.target.value)}
                        autoComplete="new-password"
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                        tabIndex={-1}
                    >
                        {showPasswordConfirm ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        )}
                    </button>
                </div>
                {errors.passwordConfirm && (
                    <p className="text-xs text-red-500 mt-1">{errors.passwordConfirm}</p>
                )}
            </div>

            {/* Términos y condiciones */}
            <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                    <div className="pt-0.5">
                        <input
                            type="checkbox"
                            checked={form.aceptaTerminos}
                            onChange={(e) => updateField('aceptaTerminos', e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500 cursor-pointer"
                        />
                    </div>
                    <span className="text-sm text-gray-600">
                        Acepto los{' '}
                        <a
                            href="https://web.trabajo-ya.com/public/terms"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-500 hover:underline font-medium"
                        >
                            Términos y Condiciones
                        </a>{' '}
                        y la{' '}
                        <a
                            href="https://web.trabajo-ya.com/public/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-500 hover:underline font-medium"
                        >
                            Política de Privacidad
                        </a>
                    </span>
                </label>
                {errors.aceptaTerminos && (
                    <p className="text-xs text-red-500 mt-1 ml-8">{errors.aceptaTerminos}</p>
                )}
            </div>
        </div>
    );

    // ── Render principal ───────────────────────────────────────────

    return (
        <div className="relative min-h-screen overflow-hidden bg-white">
            {/* Brillo de fondo */}
            <div className="absolute inset-0 bg-gradient-to-b from-white via-white via-70% to-[#6092cc]/10" />

            {/* Círculos decorativos */}
            <div className="absolute inset-0 z-0">
                <div className="absolute -bottom-24 -left-24 w-[420px] h-[420px] rounded-full bg-teal-200/20 animate-float-1" />
                <div className="absolute -bottom-8 left-16 w-[320px] h-[320px] rounded-full bg-cyan-200/15 animate-float-2" />
                <div className="absolute -bottom-20 right-[30%] w-[280px] h-[280px] rounded-full bg-teal-100/15 animate-float-3" />
                <div className="absolute -top-16 -left-16 w-[300px] h-[300px] rounded-full bg-cyan-100/10 animate-float-4" />
                <div className="absolute -top-20 right-[10%] w-[350px] h-[350px] rounded-full bg-teal-100/10 animate-float-5" />
                <div className="absolute top-[40%] -right-16 w-[280px] h-[280px] rounded-full bg-cyan-100/10 animate-float-6" />
                <div className="absolute top-[30%] left-[15%] w-[200px] h-[200px] rounded-full bg-teal-100/10 animate-float-7" />
                <div className="absolute -bottom-16 -right-16 w-[350px] h-[350px] rounded-full bg-teal-200/15 animate-float-8" />
            </div>

            {/* Branding izquierdo */}
            <div className="hidden lg:flex absolute inset-y-0 left-0 w-[40%] items-center justify-center px-12 z-10">
                <div className="text-left">
                    <h1 className="text-5xl font-bold tracking-tight">
                        <span className="text-secondary-900">Trabajo</span>
                        <span className="text-primary-500">Ya</span>
                    </h1>
                    <p className="mt-3 text-gray-500 text-base">
                        Registrá tu empresa y empezá a publicar avisos de trabajo
                    </p>
                </div>
            </div>

            {/* Tarjeta del formulario */}
            <div className="relative z-20 min-h-screen flex items-stretch justify-center lg:justify-end lg:pr-[10%]">
                <div className="w-full max-w-lg flex flex-col bg-white shadow-xl">
                    {/* Header con logo */}
                    <div className="flex flex-col items-center pt-8 pb-4 px-8 shrink-0">
                        <Image src="/logo.png" alt="TrabajoYa" width={80} height={80} />
                        <h2 className="mt-3 text-2xl font-bold text-secondary-900">Crear cuenta</h2>
                        <p className="mt-1 text-sm text-gray-500">Registrá tu empresa en TrabajoYa</p>
                    </div>

                    {/* Stepper */}
                    <div className="px-8 pb-4 shrink-0">
                        <div className="flex items-center justify-between">
                            {STEPS.map((step, idx) => (
                                <div key={idx} className="flex items-center flex-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // Solo permitir ir a pasos anteriores o al actual
                                            if (idx < currentStep) setCurrentStep(idx);
                                        }}
                                        className={`flex items-center gap-2 text-xs font-medium transition-colors ${idx === currentStep
                                            ? 'text-primary-500'
                                            : idx < currentStep
                                                ? 'text-secondary-900 cursor-pointer hover:text-primary-500'
                                                : 'text-gray-400'
                                            }`}
                                    >
                                        <span
                                            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${idx === currentStep
                                                ? 'bg-primary-500 text-white'
                                                : idx < currentStep
                                                    ? 'bg-secondary-900 text-white'
                                                    : 'bg-gray-200 text-gray-500'
                                                }`}
                                        >
                                            {idx < currentStep ? '✓' : idx + 1}
                                        </span>
                                        <span className="hidden sm:inline">{step.title}</span>
                                    </button>
                                    {idx < STEPS.length - 1 && (
                                        <div
                                            className={`flex-1 h-0.5 mx-2 rounded transition-colors ${idx < currentStep ? 'bg-secondary-900' : 'bg-gray-200'
                                                }`}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contenido del paso (scrollable) */}
                    <div className="flex-1 overflow-y-auto px-8 py-4">
                        {currentStep === 0 && renderStep0()}
                        {currentStep === 1 && renderStep1()}
                        {currentStep === 2 && renderStep2()}
                    </div>

                    {/* Botones de navegación */}
                    <div className="px-8 py-5 border-t border-gray-100 bg-white shrink-0">
                        <div className="flex gap-3">
                            {currentStep > 0 && (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="flex-1 rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Atrás
                                </button>
                            )}

                            {currentStep < STEPS.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="flex-1 rounded-full bg-secondary-900 px-6 py-3 text-sm font-semibold text-white hover:bg-secondary-800 transition-colors"
                                >
                                    Siguiente
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="flex-1 rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Registrando...
                                        </span>
                                    ) : (
                                        'Crear cuenta'
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Link a login */}
                        <p className="mt-4 text-center text-sm text-gray-500">
                            ¿Ya tenés una cuenta?{' '}
                            <Link
                                href="/login"
                                className="font-semibold text-primary-500 hover:underline"
                            >
                                Iniciar sesión
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

