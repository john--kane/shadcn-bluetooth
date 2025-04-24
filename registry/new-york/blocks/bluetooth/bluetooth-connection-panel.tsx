"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/new-york/ui/card";
import { ScrollArea } from "@/registry/new-york/ui/scroll-area";
import { Button } from "@/registry/new-york/ui/button";
import { Input } from "@/registry/new-york/ui/input";
import { Label } from "@/registry/new-york/ui/label";
import { BluetoothManager, BluetoothDevice } from "./utils";
import { RefreshCw } from "lucide-react";

interface Service {
  uuid: string;
  name?: string;
  characteristics: Characteristic[];
}

interface Characteristic {
  uuid: string;
  name?: string;
  properties: string[];
}

interface BluetoothConnectionPanelProps {
  device: BluetoothDevice;
  onError?: (error: Error) => void;
}

export function BluetoothConnectionPanel({
  device,
  onError
}: BluetoothConnectionPanelProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedCharacteristic, setSelectedCharacteristic] = useState<Characteristic | null>(null);
  const [writeValue, setWriteValue] = useState<string>("");
  const [readValue, setReadValue] = useState<string>("");
  const [isReading, setIsReading] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const bluetoothManager = BluetoothManager.getInstance();

  useEffect(() => {
    const loadServices = async () => {
      try {
        const deviceServices = await bluetoothManager.discoverServices(device);
        setServices(deviceServices);
        if (deviceServices.length > 0) {
          setSelectedService(deviceServices[0]);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to discover services");
        onError?.(error);
      }
    };

    if (device.isConnected) {
      loadServices();
    }
  }, [device.id, device.isConnected]);

  const handleRead = async () => {
    if (!selectedCharacteristic || !selectedService) return;

    try {
      setIsReading(true);
      const value = await bluetoothManager.readCharacteristic(
        device,
        selectedService.uuid,
        selectedCharacteristic.uuid
      );
      setReadValue(value.toString());
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to read characteristic");
      onError?.(error);
    } finally {
      setIsReading(false);
    }
  };

  const handleWrite = async () => {
    if (!selectedCharacteristic || !selectedService || !writeValue) return;

    try {
      setIsWriting(true);
      // Write functionality not available in current BluetoothManager
      setError(new Error("Write functionality not implemented"));
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to write characteristic");
      onError?.(error);
    } finally {
      setIsWriting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {device.name || "Unknown Device"}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedService(null)}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Services</Label>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              {services.map((service) => (
                <div
                  key={service.uuid}
                  className={`p-2 rounded-md cursor-pointer ${
                    selectedService?.uuid === service.uuid
                      ? "bg-muted"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedService(service)}
                >
                  <div className="font-medium">{service.name || "Unknown Service"}</div>
                  <div className="text-sm text-muted-foreground">{service.uuid}</div>
                </div>
              ))}
            </ScrollArea>
          </div>

          {selectedService && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Characteristics</Label>
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  {selectedService.characteristics.map((characteristic) => (
                    <div
                      key={characteristic.uuid}
                      className={`p-2 rounded-md cursor-pointer ${
                        selectedCharacteristic?.uuid === characteristic.uuid
                          ? "bg-muted"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedCharacteristic(characteristic)}
                    >
                      <div className="font-medium">
                        {characteristic.name || "Unknown Characteristic"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {characteristic.uuid}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Properties: {characteristic.properties.join(", ")}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>

              {selectedCharacteristic && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Read Value</Label>
                    <div className="flex gap-2">
                      <Input
                        value={readValue}
                        readOnly
                        placeholder="No value read yet"
                      />
                      <Button
                        onClick={handleRead}
                        disabled={isReading || !selectedCharacteristic.properties.includes("read")}
                      >
                        {isReading ? "Reading..." : "Read"}
                      </Button>
                    </div>
                  </div>

                  {selectedCharacteristic.properties.includes("write") && (
                    <div className="space-y-2">
                      <Label>Write Value</Label>
                      <div className="flex gap-2">
                        <Input
                          value={writeValue}
                          onChange={(e) => setWriteValue(e.target.value)}
                          placeholder="Enter value to write"
                        />
                        <Button
                          onClick={handleWrite}
                          disabled={isWriting || !writeValue}
                        >
                          {isWriting ? "Writing..." : "Write"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 