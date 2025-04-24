"use client";

import { useState, useEffect } from "react";
import { Button } from "@/registry/new-york/ui/button";
import { BluetoothManager, BluetoothDevice, DeviceInformation } from "./utils";
import { Battery, ChevronDown, ChevronUp, Info, RefreshCw, Trash2, Wifi, WifiOff } from "lucide-react";
import { Progress } from "@/registry/new-york/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/registry/new-york/ui/tooltip";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@radix-ui/react-accordion";
import { BluetoothStatus } from "./bluetooth-status";

interface BluetoothDeviceCardProps {
  device: BluetoothDevice;
  onDeviceSelected?: (device: BluetoothDevice) => void;
  onDeviceRemoved?: (device: BluetoothDevice) => void;
  onError?: (error: Error) => void;
}

export function BluetoothDeviceCard({
  device,
  onDeviceSelected,
  onDeviceRemoved,
  onError
}: BluetoothDeviceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInformation | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingState, setLoadingState] = useState<{
    deviceInfo: boolean;
    battery: boolean;
    characteristics: boolean;
  }>({
    deviceInfo: false,
    battery: false,
    characteristics: false
  });
  const bluetoothManager = BluetoothManager.getInstance();
  const [subscribedCharacteristics, setSubscribedCharacteristics] = useState<Set<string>>(new Set());
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [errorState, setErrorState] = useState<{
    deviceInfo: string | null;
    battery: string | null;
    characteristics: string | null;
  }>({
    deviceInfo: null,
    battery: null,
    characteristics: null
  });

  const isGattError = (error: any): boolean => {
    return error instanceof Error &&
      (error.message.includes('GATT operation already in progress') ||
        error.message.includes('GATT Server is disconnected'));
  };

  const retryOperation = async <T,>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    let lastError: Error | null = null;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        if (!isGattError(error) || i === maxRetries - 1) {
          throw lastError;
        }
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
    throw lastError;
  };

  // Load device information when device is connected
  useEffect(() => {
    const loadDeviceInfo = async () => {
      if (device.isConnected && (!deviceInfo || !lastUpdateTime || Date.now() - lastUpdateTime.getTime() > 30000)) {
        setIsLoading(true);
        setLoadingState({
          deviceInfo: true,
          battery: true,
          characteristics: true
        });

        try {
          // Read all characteristics first
          await retryOperation(async () => {
            setLoadingState(prev => ({ ...prev, characteristics: true }));
            await bluetoothManager.readAllCharacteristics(device);
            setLoadingState(prev => ({ ...prev, characteristics: false }));
          });

          // Then get the specific information we want to display
          const [info, battery] = await Promise.all([
            retryOperation(async () => {
              setLoadingState(prev => ({ ...prev, deviceInfo: true }));
              const result = await bluetoothManager.readDeviceInformation(device);
              setLoadingState(prev => ({ ...prev, deviceInfo: false }));
              return result;
            }),
            retryOperation(async () => {
              setLoadingState(prev => ({ ...prev, battery: true }));
              const result = await bluetoothManager.readBatteryLevel(device);
              setLoadingState(prev => ({ ...prev, battery: false }));
              return result;
            })
          ]);

          setDeviceInfo(info);
          setBatteryLevel(battery);
          setLastUpdateTime(new Date());
          setErrorState({
            deviceInfo: null,
            battery: null,
            characteristics: null
          });
        } catch (error) {
          console.error('Failed to load device information:', error);
          if (isGattError(error)) {
            setErrorState({
              deviceInfo: 'GATT operation failed. Please try again.',
              battery: 'GATT operation failed. Please try again.',
              characteristics: 'GATT operation failed. Please try again.'
            });
          } else {
            onError?.(error instanceof Error ? error : new Error('Failed to load device information'));
          }
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadDeviceInfo();
  }, [device.isConnected, device.id]);

  const refreshDeviceInfo = async () => {
    if (!device.gatt) return;

    setIsLoading(true);
    setLoadingState({
      deviceInfo: true,
      battery: true,
      characteristics: true
    });

    try {
      // Read all characteristics first
      await retryOperation(async () => {
        setLoadingState(prev => ({ ...prev, characteristics: true }));
        await bluetoothManager.readAllCharacteristics(device);
        setLoadingState(prev => ({ ...prev, characteristics: false }));
      });

      // Then get the specific information we want to display
      const [info, battery] = await Promise.all([
        retryOperation(async () => {
          setLoadingState(prev => ({ ...prev, deviceInfo: true }));
          const result = await bluetoothManager.readDeviceInformation(device);
          setLoadingState(prev => ({ ...prev, deviceInfo: false }));
          return result;
        }),
        retryOperation(async () => {
          setLoadingState(prev => ({ ...prev, battery: true }));
          const result = await bluetoothManager.readBatteryLevel(device);
          setLoadingState(prev => ({ ...prev, battery: false }));
          return result;
        })
      ]);

      setDeviceInfo(info);
      setBatteryLevel(battery);
      setLastUpdateTime(new Date());
      setErrorState({
        deviceInfo: null,
        battery: null,
        characteristics: null
      });
    } catch (error) {
      console.error('Failed to refresh device information:', error);
      if (isGattError(error)) {
        setErrorState({
          deviceInfo: 'GATT operation failed. Please try again.',
          battery: 'GATT operation failed. Please try again.',
          characteristics: 'GATT operation failed. Please try again.'
        });
      } else {
        onError?.(error instanceof Error ? error : new Error('Failed to refresh device information'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      await bluetoothManager.connectToDevice(device.id);
      onDeviceSelected?.(device);
      // Device info will be loaded automatically by the useEffect
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to connect to device'));
    }
  };

  const handleDisconnect = async () => {
    try {
      await bluetoothManager.disconnectDevice(device.id);
      // Only refresh the specific device that was disconnected
      await bluetoothManager.refreshDevices(device.id);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to disconnect device'));
    }
  };

  const handleRemove = async () => {
    try {
      await bluetoothManager.removeDevice(device.id);
      onDeviceRemoved?.(device);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to remove device'));
    }
  };

  const isSubscribed = (serviceUuid: string, characteristicUuid: string) => {
    return subscribedCharacteristics.has(`${serviceUuid}-${characteristicUuid}`);
  };

  const handleReadCharacteristic = async (serviceUuid: string, characteristicUuid: string) => {
    if (!device.gatt) return;
    try {
      const value = await bluetoothManager.readCharacteristic(device, serviceUuid, characteristicUuid);
      console.log(`Read value from ${characteristicUuid}:`, value);
      // Update the UI with the new value
      refreshDeviceInfo();
    } catch (error) {
      console.error('Failed to read characteristic:', error);
      onError?.(error instanceof Error ? error : new Error('Failed to read characteristic'));
    }
  };

  const handleWriteCharacteristic = async (serviceUuid: string, characteristicUuid: string) => {
    if (!device.gatt) return;
    try {
      // TODO: Implement write dialog
      console.log('Write to characteristic:', characteristicUuid);
    } catch (error) {
      console.error('Failed to write characteristic:', error);
      onError?.(error instanceof Error ? error : new Error('Failed to write characteristic'));
    }
  };

  const handleToggleNotifications = async (serviceUuid: string, characteristicUuid: string) => {
    if (!device.gatt) return;
    try {
      const key = `${serviceUuid}-${characteristicUuid}`;
      if (isSubscribed(serviceUuid, characteristicUuid)) {
        await bluetoothManager.stopNotifications(device, serviceUuid, characteristicUuid);
        setSubscribedCharacteristics(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      } else {
        await bluetoothManager.startNotifications(device, serviceUuid, characteristicUuid);
        setSubscribedCharacteristics(prev => {
          const newSet = new Set(prev);
          newSet.add(key);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Failed to toggle notifications:', error);
      onError?.(error instanceof Error ? error : new Error('Failed to toggle notifications'));
    }
  };

  const getPropertyDescription = (prop: string): string => {
    switch (prop.toLowerCase()) {
      case 'read':
        return 'This characteristic can be read';
      case 'write':
        return 'This characteristic can be written to';
      case 'notify':
        return 'This characteristic can send notifications';
      case 'indicate':
        return 'This characteristic can send indications';
      case 'broadcast':
        return 'This characteristic can broadcast';
      case 'writewithoutresponse':
        return 'This characteristic can be written to without response';
      case 'authenticatedsignedwrites':
        return 'This characteristic supports authenticated signed writes';
      case 'extendedproperties':
        return 'This characteristic has extended properties';
      default:
        return prop;
    }
  };

  const formatCharacteristicValue = (value: DataView): string => {
    try {
      // Try to decode as UTF-8 text first
      const text = new TextDecoder().decode(value);
      if (text && !text.includes('\u0000')) {
        return text;
      }
    } catch (e) {
      // If text decoding fails, try other formats
    }

    // If it's a single byte value (like battery level)
    if (value.byteLength === 1) {
      return value.getUint8(0).toString();
    }

    // If it's a 16-bit value
    if (value.byteLength === 2) {
      return value.getUint16(0, true).toString();
    }

    // If it's a 32-bit value
    if (value.byteLength === 4) {
      return value.getUint32(0, true).toString();
    }

    // If all else fails, show as hex
    const bytes = new Uint8Array(value.buffer);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ');
  };

  return (
    <div className="flex flex-col space-y-2 p-4 border-b last:border-b-0">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex flex-col items-start gap-1">
          <span className="font-medium">
            {device.name || 'Unknown Device'}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {device.id}
          </span>
        </div>
        <div className="flex items-center gap-2">
          

          <BluetoothStatus  device={device}/>

          {!device.isConnected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  await handleConnect();
                  setIsExpanded(true);
                } catch (error) {
                  console.error('Failed to connect to device:', error);
                }
              }}
              className="text-green-500 hover:text-green-700"
            >
              <Wifi className="h-4 w-4" />
              <span>Connect</span>
            </Button>
          )}


          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {device.isConnected ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDisconnect}
                    className="text-red-500 hover:text-red-700"
                  >
                    <WifiOff className="h-4 w-4" />
                    <span>Disconnect</span>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemove}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    {/* <span>Remove</span> */}
                  </Button>
                )}
              </TooltipTrigger>
              <TooltipContent>
                <p>{device.isConnected ? 'Disconnect from device' : 'Remove device'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {device.isConnected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {device.isConnected && isExpanded && (
        <div className="space-y-4 pl-4 border-l">
          {batteryLevel !== null && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Battery className="h-4 w-4" />
                <span>Battery Level</span>
                {loadingState.battery ? (
                  <div className="ml-auto flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <span className="ml-auto font-medium">{batteryLevel}%</span>
                )}
              </div>
              {errorState.battery && (
                <div className="text-xs text-red-500">{errorState.battery}</div>
              )}
              <Progress value={batteryLevel} className="h-2" />
            </div>
          )}

          {deviceInfo && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>Device Details</span>
                {loadingState.deviceInfo ? (
                  <div className="ml-auto flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshDeviceInfo}
                    disabled={isLoading}
                    className="ml-auto"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                )}
              </div>
              {errorState.deviceInfo && (
                <div className="text-xs text-red-500">{errorState.deviceInfo}</div>
              )}
              {lastUpdateTime && (
                <div className="text-xs text-muted-foreground">
                  Last updated: {lastUpdateTime.toLocaleTimeString()}
                </div>
              )}
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

          {device.services && device.services.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>Services & Characteristics</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshDeviceInfo}
                  disabled={isLoading}
                  className="ml-auto"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <Accordion type="multiple" className="w-full">
                {device.services.map((service) => (
                  <AccordionItem key={service.uuid} value={service.uuid}>
                    <AccordionTrigger className="text-sm py-2">
                    <span className="cursor-help">
                              {bluetoothManager.getServiceName(service.uuid) || service.uuid}
                            </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pl-4">
                        {service.characteristics.map((char) => (
                          <div key={char.uuid} className="text-sm text-muted-foreground">
                            <div className="flex items-center justify-between">
                              <span className="cursor-help">
                                {bluetoothManager.getCharacteristicName(char.uuid) || char.uuid}

                              </span>
                              <div className="flex items-center gap-2">

                                <div>
                                  {bluetoothManager.getCharacteristicValue(char.uuid) ? (
                                    <div className="text-xs text-muted-foreground">
                                      {formatCharacteristicValue(bluetoothManager.getCharacteristicValue(char.uuid)!)}
                                    </div>
                                  ) : null}
                                </div>
                                <div className="flex gap-1">
                                  {char.properties.map((prop) => (
                                    <TooltipProvider key={prop}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span
                                            className="px-1 py-0.5 text-xs rounded bg-muted cursor-help"
                                          >
                                            {prop}
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{getPropertyDescription(prop)}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ))}
                                </div>
                                <div className="flex gap-1">
                                  {char.properties.includes('read') && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2"
                                      onClick={() => handleReadCharacteristic(service.uuid, char.uuid)}
                                    >
                                      <RefreshCw className="h-4 w-4" />test
                                    </Button>
                                  )}
                                  {char.properties.includes('write') && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2"
                                      onClick={() => handleWriteCharacteristic(service.uuid, char.uuid)}
                                    >
                                      Write
                                    </Button>
                                  )}
                                  {char.properties.includes('notify') && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2"
                                      onClick={() => handleToggleNotifications(service.uuid, char.uuid)}
                                    >
                                      {isSubscribed(service.uuid, char.uuid) ? 'Unsubscribe' : 'Subscribe'}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                            {char.value && (
                              <div className="text-xs mt-1 flex items-center gap-2">
                                <span>Value:</span>
                                <code className="bg-muted px-2 py-1 rounded">
                                  {formatCharacteristicValue(char.value)}
                                </code>
                                {char.lastUpdated && (
                                  <span className="text-xs text-muted-foreground">
                                    (Updated: {new Date(char.lastUpdated).toLocaleTimeString()})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
