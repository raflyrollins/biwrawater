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

export interface AssignDriver {
    id: number;
    user_id: number;
    user: { name: string };
}

interface AssignDeliveryFormProps {
    orderUuid: string;
    totalLiters: number;
    trucks: AssignTruck[];
    drivers: AssignDriver[];
}

export default function AssignDeliveryForm({
    orderUuid,
    totalLiters,
    trucks,
    drivers,
}: AssignDeliveryFormProps) {
    const { data, setData, errors, processing, post } = useForm({
        truck_id: '',
        driver_id: '',
        note: '',
    });

    const selectedTruck = trucks.find((t) => String(t.id) === data.truck_id);
    const defaultDriverName = selectedTruck?.defaultDriver?.user.name ?? null;

    function selectTruck(truckId: string) {
        setData('truck_id', truckId);
        const truck = trucks.find((t) => String(t.id) === truckId);
        const defaultDriverId = truck?.default_driver_id;
        setData(
            'driver_id',
            defaultDriverId != null ? String(defaultDriverId) : '',
        );
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        post(assign.url({ order: orderUuid }));
    }

    return (
        <form onSubmit={submit} className="card p-6">
            <p className="label-caps text-body-subtle">Tugaskan Pengiriman</p>
            <p className="mt-2 text-sm text-body-subtle">
                Volume:{' '}
                <span className="font-semibold text-heading">
                    {totalLiters.toLocaleString('id-ID')} liter
                </span>
            </p>

            <div className="mt-5 space-y-5">
                <div>
                    <Select
                        label="Armada"
                        value={data.truck_id}
                        onChange={(value) => selectTruck(String(value))}
                        options={trucks.map((truck) => ({
                            value: String(truck.id),
                            label: `${truck.name} · ${truck.plate_number} (${truck.capacity_liters.toLocaleString('id-ID')} L)`,
                        }))}
                        placeholder="Pilih armada"
                        error={errors.truck_id}
                        searchPlaceholder="Cari armada..."
                    />
                </div>

                <div>
                    <Select
                        label="Driver"
                        value={data.driver_id}
                        onChange={(value) =>
                            setData('driver_id', String(value))
                        }
                        options={drivers.map((driver) => ({
                            value: String(driver.id),
                            label: driver.user.name,
                        }))}
                        placeholder={
                            defaultDriverName
                                ? `Driver default (${defaultDriverName})`
                                : 'Pilih driver'
                        }
                        disabled={!selectedTruck}
                        error={errors.driver_id}
                        searchPlaceholder="Cari driver..."
                    />
                    <p className="mt-1 text-xs text-body-subtle">
                        Pilihan pertama memakai driver default truk.
                    </p>
                </div>

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
