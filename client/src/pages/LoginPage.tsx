import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { HK_APP, HK_BILL_COMPANY } from '../lib/company';

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginFormValues>();

  const onSubmit = async (values: LoginFormValues) => {
    setError(null);
    try {
      await login(values.email, values.password);
      navigate('/');
    } catch {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-4 border border-gray-200">
        <div className="text-center border-b border-gray-100 pb-4 mb-2">
          <h1 className="text-xl font-bold text-gray-900">{HK_APP.shortName}</h1>
          <p className="text-sm text-gray-600 mt-1">{HK_APP.legalName}</p>
          <p className="text-xs text-gray-500 mt-2">{HK_APP.tagline}</p>
          <p className="text-xs text-gray-400 mt-1">GSTIN {HK_BILL_COMPANY.gstin}</p>
        </div>
        <h2 className="text-sm font-semibold text-gray-700">Staff login</h2>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <input
          {...register('email', { required: true })}
          type="email"
          placeholder="Email"
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
        <input
          {...register('password', { required: true })}
          type="password"
          placeholder="Password"
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
