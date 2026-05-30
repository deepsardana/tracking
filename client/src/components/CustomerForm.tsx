import { useForm } from 'react-hook-form';

export interface CustomerFormValues {
  name: string;
  phone: string;
}

interface CustomerFormProps {
  initialValues?: CustomerFormValues;
  onSubmit: (values: CustomerFormValues) => Promise<void> | void;
  submitLabel?: string;
}

export function CustomerForm({ initialValues, onSubmit, submitLabel = 'Save' }: CustomerFormProps) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<CustomerFormValues>({
    defaultValues: initialValues ?? { name: '', phone: '' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          {...register('name', { required: true })}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Phone</label>
        <input
          {...register('phone', { required: true })}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
