"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/new-york/ui/card";
import { BluetoothManager, BluetoothDevice, DeviceInformation } from "@/registry/new-york/blocks/bluetooth/bluetooth-utils";
import { Battery, Info, RefreshCw } from "lucide-react";
import { Button } from "@/registry/new-york/ui/button";
import { Progress } from "@radix-ui/react-progress";

interface BluetoothDeviceInformationProps {
  device: BluetoothDevice;
}

export function BluetoothDeviceInformation({ device }: BluetoothDeviceInformationProps) {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInformation | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const bluetoothManager = BluetoothManager.getInstance();

  const refreshDeviceInfo = async () => {
    if (!device.gatt) return;
    
    setIsLoading(true);
    try {
      const [info, battery] = await Promise.all([
        bluetoothManager.readDeviceInformation(device),
        bluetoothManager.readBatteryLevel(device)
      ]);
      setDeviceInfo(info);
      setBatteryLevel(battery);
    } catch (error) {
      console.error('Failed to refresh device information:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshDeviceInfo();
  }, [device]);

  if (!device.gatt) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Device Information</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshDeviceInfo}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {batteryLevel !== null && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Battery className="h-4 w-4" />
                <span>Battery Level</span>
                <span className="ml-auto font-medium">{batteryLevel}%</span>
              </div>
              <Progress value={batteryLevel} className="h-2" />
            </div>
          )}

          {deviceInfo && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>Device Details</span>
              </div>
              <div className="grid gap-2 text-sm">
                {deviceInfo.manufacturerName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Manufacturer</span>
                    <span>{deviceInfo.manufacturerName}</span>
                  </div>
                )}
                {deviceInfo.modelNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model</span>
                    <span>{deviceInfo.modelNumber}</span>
                  </div>
                )}
                {deviceInfo.serialNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Serial Number</span>
                    <span>{deviceInfo.serialNumber}</span>
                  </div>
                )}
                {deviceInfo.hardwareRevision && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hardware Revision</span>
                    <span>{deviceInfo.hardwareRevision}</span>
                  </div>
                )}
                {deviceInfo.firmwareRevision && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Firmware Revision</span>
                    <span>{deviceInfo.firmwareRevision}</span>
                  </div>
                )}
                {deviceInfo.softwareRevision && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Software Revision</span>
                    <span>{deviceInfo.softwareRevision}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 