"use client";

import { Button } from "@/registry/new-york/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/registry/new-york/ui/tooltip";
import { BluetoothOff, RefreshCw, Scan } from "lucide-react";
import { useState } from "react";
import { BluetoothManager } from "./bluetooth-utils";

interface BluetoothToolbarProps {
  onError?: (error: Error) => void;
  onScanStart?: () => void;
  onScanStop?: () => void;
}

export function BluetoothToolbar({
  onError,
  onScanStart,
  onScanStop
}: BluetoothToolbarProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const bluetoothManager = BluetoothManager.getInstance();

  const handleScan = async () => {
    try {
      setIsScanning(true);
      onScanStart?.();
      await bluetoothManager.scanForDevices();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to scan for devices");
      onError?.(error);
    } finally {
      setIsScanning(false);
      onScanStop?.();
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await bluetoothManager.refreshDevices();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to refresh devices");
      onError?.(error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDisconnectAll = async () => {
    try {
      const devices = bluetoothManager.getDevices();
      for (const device of devices) {
        if (device.isConnected) {
          await bluetoothManager.disconnectDevice(device.id);
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to disconnect devices");
      onError?.(error);
    }
  };

  return (
    <div className="flex items-center justify-between p-2 border rounded-md">
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleScan}
                disabled={isScanning}
              >
                <Scan className={`h-4 w-4 ${isScanning ? "animate-spin" : ""}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Scan for devices</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh device list</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDisconnectAll}
              >
                <BluetoothOff className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Disconnect all devices</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex items-center gap-2">
        {bluetoothManager.getDevices().filter(device => device.isConnected).length > 0 && (
          <span className="text-sm text-muted-foreground">
            {bluetoothManager.getDevices().filter(device => device.isConnected).length} device{bluetoothManager.getDevices().filter(device => device.isConnected).length !== 1 ? 's' : ''} connected
          </span>
        )}
      </div>
    </div>
  );
}
