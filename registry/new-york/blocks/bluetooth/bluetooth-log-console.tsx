"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/new-york/ui/card";
import { ScrollArea } from "@/registry/new-york/ui/scroll-area";
import { Button } from "@/registry/new-york/ui/button";
import { BluetoothManager, BluetoothDevice, Service, Characteristic } from "./utils";
import { AlertCircle, Battery, Bluetooth, BluetoothConnected, BluetoothOff, ChevronDown, ChevronUp, Info, RefreshCw, Trash2, Wifi, WifiOff } from "lucide-react";

type LogType = "info" | "error" | "data" | "event" | "connection" | "service" | "characteristic" | "connectionError" | "serviceError" | "characteristicError" | "scanError" | "disconnectError" | "removeError";

interface LogEntry {
  timestamp: string;
  type: LogType;
  message: string;
  data?: any;
}

export function BluetoothLogConsole() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bluetoothManager = BluetoothManager.getInstance();

  const addLog = (type: LogEntry["type"], message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log("Adding log:", { timestamp, type, message, data });
    setLogs(prev => [...prev, { timestamp, type, message, data }]);
  };

  useEffect(() => {
    const handleDevicesChanged = (devices: BluetoothDevice[]) => {
      addLog("event", "Devices list updated", devices);
    };

    const handleDeviceConnected = (device: BluetoothDevice) => {
      addLog("connection", `Device connected: ${device.name || device.id}`, device);
    };

    const handleDeviceDisconnected = (device: BluetoothDevice) => {
      addLog("connection", `Device disconnected: ${device.name || device.id}`, device);
    };

    const handleError = (error: Error) => {
      addLog("error", error.message, error);
    };

    const handleScanError = (error: Error) => {
      addLog("scanError", `Scan error: ${error.message}`, error);
    };

    const handleConnectError = (error: Error) => {
      addLog("connectionError", `Connection error: ${error.message}`, error);
    };

    const handleDisconnectError = (error: Error) => {
      addLog("disconnectError", `Disconnection error: ${error.message}`, error);
    };

    const handleRemoveError = (error: Error) => {
      addLog("removeError", `Remove error: ${error.message}`, error);
    };

    const handleServiceDiscovered = (service: Service) => {
      addLog("service", `Service discovered: ${service.name}`, service);
    };

    const handleCharacteristicRead = (characteristic: Characteristic) => {
      addLog("characteristic", `Characteristic read: ${characteristic.name}`, characteristic);
    };

    const handleCharacteristicWrite = (characteristic: Characteristic) => {
      addLog("characteristic", `Characteristic write: ${characteristic.name}`, characteristic);
    };

    const handleServiceError = (error: Error) => {
      addLog("serviceError", `Service error: ${error.message}`, error);
    };

    const handleCharacteristicError = (error: Error) => {
      addLog("characteristicError", `Characteristic error: ${error.message}`, error);
    };

    bluetoothManager.addListener('devicesChanged', handleDevicesChanged);
    bluetoothManager.addListener('deviceConnected', handleDeviceConnected);
    bluetoothManager.addListener('deviceDisconnected', handleDeviceDisconnected);
    bluetoothManager.addListener('error', handleError);
    bluetoothManager.addListener('scanError', handleScanError);
    bluetoothManager.addListener('connectError', handleConnectError);
    bluetoothManager.addListener('disconnectError', handleDisconnectError);
    bluetoothManager.addListener('removeError', handleRemoveError);
    bluetoothManager.addListener('serviceDiscovered', handleServiceDiscovered);
    bluetoothManager.addListener('characteristicRead', handleCharacteristicRead);
    bluetoothManager.addListener('characteristicWrite', handleCharacteristicWrite);
    bluetoothManager.addListener('serviceError', handleServiceError);
    bluetoothManager.addListener('characteristicError', handleCharacteristicError);

    return () => {
      bluetoothManager.removeListener('devicesChanged', handleDevicesChanged);
      bluetoothManager.removeListener('deviceConnected', handleDeviceConnected);
      bluetoothManager.removeListener('deviceDisconnected', handleDeviceDisconnected);
      bluetoothManager.removeListener('error', handleError);
      bluetoothManager.removeListener('scanError', handleScanError);
      bluetoothManager.removeListener('connectError', handleConnectError);
      bluetoothManager.removeListener('disconnectError', handleDisconnectError);
      bluetoothManager.removeListener('removeError', handleRemoveError);
      bluetoothManager.removeListener('serviceDiscovered', handleServiceDiscovered);
      bluetoothManager.removeListener('characteristicRead', handleCharacteristicRead);
      bluetoothManager.removeListener('characteristicWrite', handleCharacteristicWrite);
      bluetoothManager.removeListener('serviceError', handleServiceError);
      bluetoothManager.removeListener('characteristicError', handleCharacteristicError);
    };
  }, []);

  useEffect(() => {
    if (isAutoScroll && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [logs, isAutoScroll]);

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "error":
      case "connectionError":
      case "serviceError":
      case "characteristicError":
      case "scanError":
      case "disconnectError":
      case "removeError":
        return "text-red-500";
      case "info":
        return "text-blue-500";
      case "data":
        return "text-green-500";
      case "event":
        return "text-purple-500";
      case "connection":
        return "text-orange-500";
      case "service":
        return "text-indigo-500";
      case "characteristic":
        return "text-teal-500";
      default:
        return "text-foreground";
    }
  };

  const getLogIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "error":
      case "connectionError":
      case "serviceError":
      case "characteristicError":
      case "scanError":
      case "disconnectError":
      case "removeError":
        return <AlertCircle className="h-4 w-4" />;
      case "info":
        return <Info className="h-4 w-4" />;
      case "data":
        return <BluetoothConnected className="h-4 w-4" />;
      case "event":
        return <Bluetooth className="h-4 w-4" />;
      case "connection":
        return <Wifi className="h-4 w-4" />;
      case "service":
        return <Battery className="h-4 w-4" />;
      case "characteristic":
        return <BluetoothOff className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Bluetooth Log Console</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAutoScroll(!isAutoScroll)}
            className={isAutoScroll ? "text-blue-500" : ""}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearLogs}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea
          ref={scrollAreaRef}
          className="h-[300px] rounded-md border p-4 font-mono text-sm"
        >
          {logs.map((log, index) => (
            <div key={index} className="flex items-start gap-2 py-1">
              <span className="text-muted-foreground">{log.timestamp}</span>
              <span className={getLogColor(log.type)}>
                {getLogIcon(log.type)}
              </span>
              <span className={getLogColor(log.type)}>{log.message}</span>
              {log.data && (
                <pre className="text-muted-foreground">
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 