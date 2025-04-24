"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/new-york/ui/card";
import { ScrollArea } from "@/registry/new-york/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/new-york/ui/select";
import { BluetoothManager, BluetoothDevice } from "./utils";
import { BluetoothDeviceCard } from "./bluetooth-device-card";
import { BluetoothToolbar } from "./bluetooth-toolbar";
import { AlertCircle } from "lucide-react";
import { BluetoothDeviceInformation } from "./bluetooth-device-information";

type DeviceFilter = "all" | "connected" | "paired";

interface BluetoothDeviceListProps {
  onDeviceSelected?: (device: BluetoothDevice) => void;
  onDeviceRemoved?: (device: BluetoothDevice) => void;
  onError?: (error: Error) => void;
}

export function BluetoothDeviceList({
  onDeviceSelected,
  onDeviceRemoved,
  onError
}: BluetoothDeviceListProps) {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<DeviceFilter>("all");
  const bluetoothManager = BluetoothManager.getInstance();

  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const available = await bluetoothManager.isBluetoothAvailable();
        setIsAvailable(available);
        if (!available) {
          setError("Bluetooth is not available on this device");
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to check Bluetooth availability");
        setError(error.message);
        onError?.(error);
      }
    };

    checkAvailability();
  }, []);

  useEffect(() => {
    const handleDevicesChanged = (newDevices: BluetoothDevice[]) => {
      setDevices([...newDevices]);
    };

    const handleError = (error: Error) => {
      setError(error.message);
      onError?.(error);
    };

    bluetoothManager.addListener('devicesChanged', handleDevicesChanged);
    bluetoothManager.addListener('error', handleError);

    // Load initial devices
    const initialDevices = bluetoothManager.getDevices();
    setDevices(initialDevices);

    return () => {
      bluetoothManager.removeListener('devicesChanged', handleDevicesChanged);
      bluetoothManager.removeListener('error', handleError);
    };
  }, []);

  const filteredDevices = devices.filter(device => {
    switch (filter) {
      case "connected":
        return device.isConnected;
      case "paired":
        return !device.isConnected;
      default:
        return true;
    }
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bluetooth Devices</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(value: DeviceFilter) => setFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter devices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                <SelectItem value="connected">Connected</SelectItem>
                <SelectItem value="paired">Paired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <BluetoothToolbar
          onError={onError}
          onScanStart={() => setError(null)}
          onScanStop={() => setError(null)}
        />

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {filteredDevices.length > 0 ? (
          <div className="space-y-2">
            {filteredDevices.map((device) => (
              <div key={device.id} className="space-y-4">
                <BluetoothDeviceCard
                  device={device}
                  onDeviceSelected={onDeviceSelected}
                  onDeviceRemoved={onDeviceRemoved}
                  onError={onError}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            {devices.length === 0 ? "No devices paired yet" : "No devices match the current filter"}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 