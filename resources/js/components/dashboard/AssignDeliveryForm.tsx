import { useForm } from '@inertiajs/react';

import type { FormEvent } from 'react';

import { assign } from '../../routes/dashboard/orders';
import FieldError from '../public/FieldError';
import Select from '../ui/Select';

export interface AssignTruck {
    id: number;
    name: string;
    plate_number: string;
    capacity_liters: number;
    default_driver_id: number | null;
    defaultDriver?: {
        user: { name: string };
    } | null;
}

interface AssignDeliveryFormProps {
    orderUuid: string;
    totalLiters: number;
    trucks: AssignTruck[];
}

export default function AssignDeliveryForm({
    orderUuid,
    totalLiters,
    trucks,
}: AssignDeliveryFormProps) {
    const { data, setData, errors, processing, post } = useForm({
        truck_id: '',
        note: '',
    });

    const selectedTruck = trucks.find(
        (t) => String(t.id) === data.truck_id,
    );
    const driverName =
        selectedTruck?.defaultDriver?.user.name ?? '-';

    function submit(e: FormEvent) {
        e.preventDefault();
        post(assign.url({ order: orderUuid }));
    }

    return (
        <form onSubmit={submit} className="card p-6">
            <p className="label-caps text-body-subtle">Tugaskan Pengiriman</p>
            <p className="mt-2 text-sm text-body-subtle">
                Volume: <span className="font-semibold text-heading">{totalLiters.toLocaleString('id-ID')} liter</span>
            </p>

            <div className="mt-5 space-y-5">
                <div>
                    <Select
                        label="Armada"
                        value={data.truck_id}
                        onChange={(value) => setData('truck_id', String(value))}
                        options={trucks.map((truck) => ({
                            value: String(truck.id),
                            label: `${truck.name} · ${truck.plate_number} (${truck.capacity_liters.toLocaleString('id-ID')} L)`,
                        }))}
                        placeholder="Pilih armada"
                        error={errors.truck_id}
                        searchPlaceholder="Cari armada..."
                    />
                </div>

                {selectedTruck && (
                    <div className="rounded-sm bg-neutral-tertiary-soft px-4 py-3 text-sm">
                        <span className="text-body-subtle">Driver: </span>
                        <span className="font-semibold text-heading">
                            {driverName}
                        </span>
                    </div>
                )}

                <div>
                    <label
                        htmlFor="assign-note"
                        className="mb-2 block text-sm font-semibold text-heading"
                    >
                        Catatan (opsional)
                    </label>
                    <input
                        id="assign-note"
                        type="text"
                        value={data.note}
                        onChange={(e) => setData('note', e.target.value)}
                        className="input"
                        placeholder="Catatan untuk driver"
                    />
                    <FieldError message={errors.note} />
                </div>
            </div>

            <button
                type="submit"
                disabled={processing || !data.truck_id}
                className="btn btn-brand mt-6 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {processing ? 'Menyimpan...' : 'Tugaskan & Konfirmasi'}
            </button>
        </form>
    );
}
