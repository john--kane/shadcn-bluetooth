"use client";

import { useEffect, useState } from "react";
import { BluetoothManager, BluetoothDevice } from "./utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/registry/new-york/ui/tooltip";
import { Bluetooth, BluetoothOff, BluetoothSearching, BluetoothConnected } from "lucide-react";
import { cn } from "@/lib/utils";

type SizePreset = 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;

const sizeClasses: Record<SizePreset, string> = {
  2: "w-2 h-2",
  3: "w-3 h-3",
  4: "w-4 h-4",
  5: "w-5 h-5",
  6: "w-6 h-6",
  8: "w-8 h-8",
  10: "w-10 h-10",
  12: "w-12 h-12"
};

interface BluetoothStatusColors {
  notAvailable?: string;
  available?: string;
  scanning?: string;
  connected?: string;
}

interface BluetoothStatusProps {
  size?: SizePreset;
  colors?: BluetoothStatusColors;
  showLegend?: boolean;
  device?: BluetoothDevice;
}

const defaultColors: BluetoothStatusColors = {
  notAvailable: "text-destructive",
  available: "text-blue-300",
  scanning: "text-blue-400",
  connected: "text-green-500"
};

const statusLegend = [
  { icon: BluetoothOff, color: "text-destructive", text: "Not Available" },
  { icon: Bluetooth, color: "text-blue-300", text: "Available" },
  { icon: BluetoothSearching, color: "text-blue-400", text: "Scanning" },
  { icon: BluetoothConnected, color: "text-green-500", text: "Connected" }
];

export function BluetoothStatus({ 
  size = 4, 
  colors = defaultColors,
  showLegend = false,
  device
}: BluetoothStatusProps) {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const bluetoothManager = BluetoothManager.getInstance();

  useEffect(() => {
    // Initial status check
    setIsAvailable(bluetoothManager.isBluetoothAvailable());
    if (device) {
      setIsConnected(device.isConnected);
    } else {
      const devices = bluetoothManager.getDevices();
      setIsConnected(devices.some(device => device.isConnected));
    }

    // Listen for status changes
    const handleDevicesChanged = (devices: any[]) => {
      if (device) {
        const updatedDevice = devices.find(d => d.id === device.id);
        setIsConnected(updatedDevice?.isConnected ?? false);
      } else {
        setIsConnected(devices.some(device => device.isConnected));
      }
    };

    const handleDeviceConnected = (connectedDevice: BluetoothDevice) => {
      if (!device || device.id === connectedDevice.id) {
        setIsConnected(true);
      }
    };

    const handleDeviceDisconnected = (disconnectedDevice: BluetoothDevice) => {
      if (!device || device.id === disconnectedDevice.id) {
        setIsConnected(false);
      }
    };

    bluetoothManager.addListener('devicesChanged', handleDevicesChanged);
    bluetoothManager.addListener('deviceConnected', handleDeviceConnected);
    bluetoothManager.addListener('deviceDisconnected', handleDeviceDisconnected);

    return () => {
      bluetoothManager.removeListener('devicesChanged', handleDevicesChanged);
      bluetoothManager.removeListener('deviceConnected', handleDeviceConnected);
      bluetoothManager.removeListener('deviceDisconnected', handleDeviceDisconnected);
    };
  }, [device]);

  // Determine icon and status text based on status
  const getStatusInfo = () => {
    if (!isAvailable) return { 
      text: "Bluetooth not available",
      icon: BluetoothOff,
      className: colors.notAvailable || defaultColors.notAvailable
    };
    if (isScanning) return { 
      text: "Scanning for devices",
      icon: BluetoothSearching,
      className: colors.scanning || defaultColors.scanning
    };
    if (isConnected) return { 
      text: device ? "Device connected" : "Connected to device",
      icon: BluetoothConnected,
      className: colors.connected || defaultColors.connected
    };
    return { 
      text: device ? "Device not connected" : "Available but not connected",
      icon: Bluetooth,
      className: colors.available || defaultColors.available
    };
  };

  const status = getStatusInfo();
  const Icon = status.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center">
          <Icon className={cn(sizeClasses[size], status.className)} />
          </div>
        </TooltipTrigger>
        <TooltipContent className={cn("space-y-2", showLegend ? "py-2" : " pb-1")}>
          <p className="font-medium">{status.text}</p>
          {showLegend && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Legend:</p>
              <div className="grid grid-cols-2 gap-1">
                {statusLegend.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.text} className="flex items-center gap-1">
                      <Icon className={cn("w-3 h-3", item.color)} />
                      <span className="text-xs">{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
