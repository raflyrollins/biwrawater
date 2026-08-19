import { useForm } from '@inertiajs/react';

import type { FormEvent } from 'react';

import { combineDateTime, splitDateTime, todayIso } from '../../lib/date';
import { assign } from '../../routes/dashboard/orders';
import FieldError from '../public/FieldError';
import DatePicker from '../ui/DatePicker';
import Select from '../ui/Select';

export interface AssignTruck {
    id: number;
    name: string;
    plate_number: string;
    capacity_liters: number;
}

export interface AssignDriver {
    id: number;
    user: {
        name: string;
        phone: string | null;
    };
}

interface AssignDeliveryFormProps {
    orderUuid: string;
    trucks: AssignTruck[];
    drivers: AssignDriver[];
}

export default function AssignDeliveryForm({
    orderUuid,
    trucks,
    drivers,
}: AssignDeliveryFormProps) {
    const { data, setData, errors, processing, post } = useForm({
        truck_id: '',
        driver_id: '',
        scheduled_at: '',
        note: '',
    });

    const { date, time } = splitDateTime(data.scheduled_at);

    function setScheduled(nextDate: string, nextTime: string) {
        setData('scheduled_at', combineDateTime(nextDate, nextTime));
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        post(assign.url({ order: orderUuid }));
    }

    return (
        <form onSubmit={submit} className="card p-6">
            <p className="label-caps text-body-subtle">Tugaskan Pengiriman</p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
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
                        placeholder="Pilih driver"
                        error={errors.driver_id}
                        searchPlaceholder="Cari driver..."
                    />
                </div>

                <div>
                    <DatePicker
                        label="Tanggal Pengiriman"
                        value={date}
                        onChange={(nextDate) => setScheduled(nextDate, time)}
                        error={errors.scheduled_at}
                        min={todayIso()}
                    />

                    <div className="mt-3">
                        <label
                            htmlFor="assign-time"
                            className="mb-2 block text-sm font-semibold text-heading"
                        >
                            Waktu
                        </label>
                        <input
                            id="assign-time"
                            type="time"
                            value={time}
                            onChange={(e) => setScheduled(date, e.target.value)}
                            className="input"
                        />
                    </div>
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
                disabled={processing}
                className="btn btn-brand mt-6"
            >
                {processing ? 'Menyimpan...' : 'Tugaskan & Konfirmasi'}
            </button>
        </form>
    );
}
