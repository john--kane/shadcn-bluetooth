import { GATT_SERVICES, GATT_CHARACTERISTICS, GattLookup } from './gatt-services';

export interface BluetoothDevice {
  id: string;
  name: string | null;
  gatt?: BluetoothRemoteGATTServer;
  isConnected: boolean;
  lastSeen: Date;
  services?: Service[];
  deviceInfo?: DeviceInformation;
}

export interface Service {
  uuid: string;
  name: string;
  characteristics: Characteristic[];
}

export interface Characteristic {
  uuid: string;
  name: string;
  properties: string[];
  value?: DataView;
  lastUpdated?: Date;
}

export interface DeviceInformation {
  manufacturerName?: string;
  modelNumber?: string;
  serialNumber?: string;
  hardwareRevision?: string;
  firmwareRevision?: string;
  softwareRevision?: string;
  systemId?: string;
  ieee11073?: string;
  pnpId?: string;
}

export interface CustomCharacteristic {
  uuid: string;
  key: string;
  name: string;
  valueFormatter?: (value: DataView) => string;
  onChange?: (value: string) => void;
}

interface Device {
  id: string;
  name: string;
  isConnected: boolean;
  isPaired: boolean;
  lastSeen: Date;
  services: Service[];
  characteristics: Characteristic[];
}

type EventType = 
  | 'devicesChanged'
  | 'deviceConnected'
  | 'deviceDisconnected'
  | 'error'
  | 'scanError'
  | 'connectionError'
  | 'disconnectionError'
  | 'serviceDiscovery'
  | 'characteristicRead'
  | 'characteristicWrite'
  | 'devicePaired'
  | 'connectError'
  | 'disconnectError'
  | 'removeError';

type EventCallback = (data: any) => void;

export class BluetoothManager {
  private static instance: BluetoothManager;
  private devices: BluetoothDevice[] = [];
  private eventListeners: Map<EventType, Set<EventCallback>> = new Map();
  private characteristicValues: Map<string, DataView> = new Map();
  private characteristicNotifications: Map<string, (event: Event) => void> = new Map();
  private customCharacteristics: CustomCharacteristic[] = [];
  private characteristicSubscriptions: Map<string, Set<(value: string) => void>> = new Map();
  private gattLookup: GattLookup;

  private constructor() {
    this.gattLookup = GattLookup.getInstance();
    this.loadDevices();
    this.setupBluetoothEvents();
  }

  public static getInstance(): BluetoothManager {
    if (!BluetoothManager.instance) {
      BluetoothManager.instance = new BluetoothManager();
    }
    return BluetoothManager.instance;
  }

  private loadDevices() {
    try {
      const storedDevices = localStorage.getItem('bluetoothDevices');
      if (storedDevices) {
        this.devices = JSON.parse(storedDevices).map((device: any) => ({
          ...device,
          lastSeen: new Date(device.lastSeen)
        }));
      }
    } catch (error) {
      this.emit('error', new Error('Failed to load devices from storage'));
    }
  }

  private saveDevices() {
    try {
      localStorage.setItem('bluetoothDevices', JSON.stringify(this.devices));
    } catch (error) {
      this.emit('error', new Error('Failed to save devices to storage'));
    }
  }

  private setupBluetoothEvents() {
    if (navigator.bluetooth) {
      try {
        navigator.bluetooth.addEventListener('advertisementreceived', (event) => {
          this.handleDeviceUpdate(event.device as unknown as BluetoothDevice);
        });
      } catch (error) {
        this.emit('error', new Error('Failed to setup Bluetooth event listeners'));
      }
    }
  }

  private handleDeviceUpdate(device: BluetoothDevice) {
    try {
      const existingDevice = this.devices.find(d => d.id === device.id);
      if (existingDevice) {
        existingDevice.lastSeen = new Date();
        existingDevice.isConnected = device.isConnected;
      } else {
        this.devices.push({
          ...device,
          lastSeen: new Date(),
          isConnected: false
        });
      }
      this.saveDevices();
      this.emit('devicesChanged', this.devices);
    } catch (error) {
      this.emit('error', new Error('Failed to update device information'));
    }
  }

  public addListener(event: EventType, callback: EventCallback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(callback);
  }

  public removeListener(event: EventType, callback: EventCallback) {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(event: EventType, data: any) {
    this.eventListeners.get(event)?.forEach(callback => callback(data));
  }

  public isBluetoothAvailable(): boolean {
    return !!navigator.bluetooth;
  }

  public getDevices(): BluetoothDevice[] {
    return [...this.devices];
  }

  public async scanForDevices(): Promise<BluetoothDevice> {
    if (!this.isBluetoothAvailable()) {
      const error = new Error('Bluetooth is not available');
      this.emit('scanError', error);
      throw error;
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information']
      });

      const newDevice: BluetoothDevice = {
        id: device.id,
        name: device.name || null,
        gatt: device.gatt,
        isConnected: false,
        lastSeen: new Date()
      };

      // Add the device to our list
      this.handleDeviceUpdate(newDevice);

      // Try to connect to the device
      try {
        console.log("Attempting to connect to newly paired device:", newDevice.name || newDevice.id);
        const connectedDevice = await this.connectToDevice(newDevice.id);
        console.log("Successfully connected to device:", connectedDevice.name || connectedDevice.id);
        return connectedDevice;
      } catch (error) {
        console.error("Failed to connect to device after pairing:", error);
        // Still return the device even if connection fails
        return newDevice;
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to scan for devices');
      this.emit('scanError', err);
      throw err;
    }
  }

  private async readDeviceInformationWithRetry(
    device: BluetoothDevice,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<DeviceInformation> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempting to read device information (attempt ${attempt}/${maxRetries})...`);
        const info = await this.readDeviceInformation(device);
        console.log(`Successfully read device information on attempt ${attempt}`);
        return info;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`Failed to read device information (attempt ${attempt}/${maxRetries}):`, {
          error: lastError.message,
          stack: lastError.stack,
          deviceId: device.id,
          deviceName: device.name
        });
        
        if (attempt < maxRetries) {
          console.log(`Waiting ${retryDelay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    throw lastError || new Error('Failed to read device information after all retries');
  }

  public async refreshDeviceInformation(device: BluetoothDevice): Promise<DeviceInformation> {
    if (!device.gatt) {
      throw new Error('Device not connected');
    }

    try {
      console.log(`Refreshing device information for ${device.name || device.id}...`);
      const deviceInfo = await this.readDeviceInformationWithRetry(device);
      device.deviceInfo = deviceInfo;
      this.handleDeviceUpdate(device);
      this.emit('deviceConnected', device);
      console.log('Device information refreshed successfully:', deviceInfo);
      return deviceInfo;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to refresh device information');
      console.error('Error refreshing device information:', {
        error: err.message,
        stack: err.stack,
        deviceId: device.id,
        deviceName: device.name
      });
      this.emit('error', err);
      throw err;
    }
  }

  public async connectToDevice(deviceId: string): Promise<BluetoothDevice> {
    console.log("Connecting to device:", deviceId);
    const device = this.devices.find(d => d.id === deviceId);
    console.log("device", device);
    if (!device) {
      const error = new Error('Device not found');
      this.emit('connectError', error);
      throw error;
    }

    try {
      const bluetoothDevice = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information']
      });

      if (bluetoothDevice.id !== deviceId) {
        throw new Error('Device ID mismatch');
      }

      const server = await bluetoothDevice.gatt?.connect();
      if (server) {
        device.gatt = server;
        device.isConnected = true;
        
        // Query primary services
        console.log("Querying primary services...");
        const services = await server.getPrimaryServices();
        console.log("Found services:", services.length);
        
        // Log each service's details
        for (const service of services) {
          console.log(`Service: ${this.getServiceName(service.uuid)} (${service.uuid})`);
          try {
            const characteristics = await service.getCharacteristics();
            console.log(`  Characteristics (${characteristics.length}):`);
            for (const char of characteristics) {
              console.log(`    - ${this.getCharacteristicName(char.uuid)} (${char.uuid})`);
              console.log(`      Properties: ${Object.keys(char.properties).join(', ')}`);
            }
          } catch (error) {
            console.error(`Failed to get characteristics for service ${service.uuid}:`, {
              error: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined,
              serviceUuid: service.uuid
            });
          }
        }
        
        // Read device information with retry
        try {
          console.log("Reading device information...");
          const deviceInfo = await this.readDeviceInformationWithRetry(device);
          console.log("Device information:", deviceInfo);
          device.deviceInfo = deviceInfo;
        } catch (error) {
          console.error("Failed to read device information after retries:", {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            deviceId: device.id,
            deviceName: device.name
          });
        }
        
        // Discover services and characteristics
        const discoveredServices = await this.discoverServices(device);
        device.services = discoveredServices;
        
        this.handleDeviceUpdate(device);
        this.emit('deviceConnected', device);
        
        // Read all characteristics after connecting
        await this.readAllCharacteristics(device);
      }
      return device;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to connect to device');
      console.error('Error connecting to device:', {
        error: err.message,
        stack: err.stack,
        deviceId: deviceId,
        attemptedDevice: device ? {
          id: device.id,
          name: device.name
        } : 'Device not found in local list'
      });
      this.emit('connectError', err);
      throw err;
    }
  }

  public async disconnectDevice(deviceId: string): Promise<void> {
    console.log("Attempting to disconnect device:", deviceId);
    const device = this.devices.find(d => d.id === deviceId);
    if (!device) {
      console.log("Device not found for disconnection");
      const error = new Error('Device not found');
      this.emit('disconnectError', error);
      throw error;
    }

    try {
      console.log("Disconnecting device:", device.name || device.id);
      if (device.gatt) {
        // Set connected to false and clear the GATT server reference
        device.isConnected = false;
        device.gatt = undefined;
      }
      this.handleDeviceUpdate(device);
      console.log("Device disconnected successfully:", device.name || device.id);
      this.emit('deviceDisconnected', device);
    } catch (error) {
      console.error("Error disconnecting device:", error);
      const err = error instanceof Error ? error : new Error('Failed to disconnect device');
      this.emit('disconnectError', err);
      throw err;
    }
  }

  public removeDevice(deviceId: string): BluetoothDevice | null {
    try {
      console.log("Attempting to remove device:", deviceId);
      
      const device = this.devices.find(d => d.id === deviceId);
      if (!device) {
        console.log("Device not found in list");
        return null;
      }

      // Clean up any active subscriptions for this device
      for (const [key] of this.characteristicSubscriptions) {
        if (key.startsWith(deviceId)) {
          this.characteristicSubscriptions.delete(key);
        }
      }

      // Clean up any active notifications for this device
      for (const [key] of this.characteristicNotifications) {
        if (key.startsWith(deviceId)) {
          this.characteristicNotifications.delete(key);
        }
      }

      // Remove the device
      this.devices = this.devices.filter(d => d.id !== deviceId);
      console.log("Device removed successfully");
      
      this.saveDevices();
      this.emit('devicesChanged', [...this.devices]);
      return device;
    } catch (error) {
      console.error("Error removing device:", error);
      const err = error instanceof Error ? error : new Error('Failed to remove device');
      this.emit('removeError', err);
      throw err;
    }
  }

  public getServiceName(uuid: string): string {
    return this.gattLookup.getServiceName(uuid);
  }

  public async discoverServices(device: BluetoothDevice): Promise<Service[]> {
    if (!device.gatt) {
      const error = new Error('Device not connected');
      this.emit('error', error);
      throw error;
    }

    try {
      const services = await device.gatt.getPrimaryServices();
      return Promise.all(services.map(async (service) => {
        try {
          const characteristics = await service.getCharacteristics();
          return {
            uuid: service.uuid,
            name: this.getServiceName(service.uuid),
            characteristics: characteristics.map(char => ({
              uuid: char.uuid,
              name: this.getCharacteristicName(char.uuid),
              properties: Object.keys(char.properties)
            }))
          };
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Failed to get characteristics');
          this.emit('error', err);
          throw err;
        }
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to discover services');
      this.emit('error', err);
      throw err;
    }
  }

  public async readCharacteristic(
    device: BluetoothDevice,
    serviceUuid: string,
    characteristicUuid: string
  ): Promise<DataView> {
    if (!device.gatt) {
      const error = new Error('Device not connected');
      this.emit('error', error);
      throw error;
    }

    try {
      const service = await device.gatt.getPrimaryService(serviceUuid);
      const characteristic = await service.getCharacteristic(characteristicUuid);
      return characteristic.readValue();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to read characteristic');
      this.emit('error', err);
      throw err;
    }
  }

  public async refreshDevices(deviceId?: string): Promise<void> {
    try {
      console.log("Refreshing devices list", deviceId ? `for device ${deviceId}` : "");
      // Reload devices from storage
      this.loadDevices();
      
      // Update connection status for devices
      for (const device of this.devices) {
        // If a specific deviceId is provided, only check that device
        if (deviceId && device.id !== deviceId) {
          continue;
        }

        try {
          // If device has a GATT server, check if it's still connected
          if (device.gatt) {
            // The Web Bluetooth API doesn't provide a direct way to check connection status
            // So we'll try to get a service to verify the connection
            try {
              await device.gatt.getPrimaryService('battery_service');
              device.isConnected = true;
              console.log(`Device ${device.id} is connected`);
            } catch (error) {
              // If we can't get a service, the device is disconnected
              device.isConnected = false;
              device.gatt = undefined;
              console.log(`Device ${device.id} is disconnected`);
            }
          } else {
            device.isConnected = false;
          }
          device.lastSeen = new Date();
        } catch (error) {
          device.isConnected = false;
          device.gatt = undefined;
          console.log(`Device ${device.id} is not connected`);
        }
      }
      
      this.saveDevices();
      this.emit('devicesChanged', [...this.devices]);
    } catch (error) {
      console.error("Error refreshing devices:", error);
      const err = error instanceof Error ? error : new Error('Failed to refresh devices');
      this.emit('error', err);
      throw err;
    }
  }

  public registerCustomCharacteristic(characteristic: CustomCharacteristic) {
    // Check if characteristic already exists
    const exists = this.customCharacteristics.some(c => c.uuid === characteristic.uuid);
    if (!exists) {
      this.customCharacteristics.push(characteristic);
      console.log(`Registered custom characteristic: ${characteristic.name} (${characteristic.uuid})`);
    }
  }

  public unregisterCustomCharacteristic(uuid: string) {
    this.customCharacteristics = this.customCharacteristics.filter(c => c.uuid !== uuid);
  }

  public async readDeviceInformation(device: BluetoothDevice): Promise<DeviceInformation> {
    if (!device.gatt) {
      throw new Error('Device not connected');
    }

    try {
      const deviceInfoService = await device.gatt.getPrimaryService('device_information');
      const info: DeviceInformation = {};

      // Base list of standard device information characteristics
      const standardCharacteristics: Array<{
        uuid: string;
        key: string;
        name: string;
        valueFormatter?: (value: DataView) => string;
      }> = [
        { uuid: 'manufacturer_name_string', key: 'manufacturerName', name: 'Manufacturer Name' },
        { uuid: 'model_number_string', key: 'modelNumber', name: 'Model Number' },
        { uuid: 'serial_number_string', key: 'serialNumber', name: 'Serial Number' },
        { uuid: 'hardware_revision_string', key: 'hardwareRevision', name: 'Hardware Revision' },
        { uuid: 'firmware_revision_string', key: 'firmwareRevision', name: 'Firmware Revision' },
        { uuid: 'software_revision_string', key: 'softwareRevision', name: 'Software Revision' },
        { uuid: 'system_id', key: 'systemId', name: 'System ID' },
        { uuid: 'ieee_11073-20601_regulatory_certification_data_list', key: 'ieee11073', name: 'IEEE 11073' },
        { uuid: 'pnp_id', key: 'pnpId', name: 'PnP ID' }
      ];

      // Combine standard and custom characteristics
      const allCharacteristics = [...standardCharacteristics, ...this.customCharacteristics];

      // Try to read each characteristic
      for (const { uuid, key, name, valueFormatter } of allCharacteristics) {
        try {
          const characteristic = await deviceInfoService.getCharacteristic(uuid);
          const value = await characteristic.readValue();
          
          // Use custom formatter if provided, otherwise use default formatting
          if (valueFormatter) {
            info[key as keyof DeviceInformation] = valueFormatter(value);
          } else if (uuid === 'system_id' || uuid === 'pnp_id') {
            // Convert to hex string
            const hexArray = Array.from(new Uint8Array(value.buffer))
              .map(b => b.toString(16).padStart(2, '0'));
            info[key as keyof DeviceInformation] = hexArray.join(':');
          } else {
            // Convert to string
            info[key as keyof DeviceInformation] = new TextDecoder().decode(value);
          }
          
          console.log(`Read ${name}:`, info[key as keyof DeviceInformation]);
        } catch (error) {
          console.log(`Characteristic ${name} (${uuid}) not available:`, error);
          // Don't throw, just continue with next characteristic
        }
      }

      // Log the complete device information
      console.log('Complete Device Information:', info);
      return info;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to read device information');
      this.emit('error', err);
      throw err;
    }
  }

  public async readBatteryLevel(device: BluetoothDevice): Promise<number | null> {
    if (!device.gatt) {
      throw new Error('Device not connected');
    }

    try {
      const batteryService = await device.gatt.getPrimaryService('battery_service');
      const batteryLevelChar = await batteryService.getCharacteristic('battery_level');
      const value = await batteryLevelChar.readValue();
      return value.getUint8(0);
    } catch (error) {
      console.log('Battery level not available');
      return null;
    }
  }

  private async readCharacteristicString(characteristic: BluetoothRemoteGATTCharacteristic): Promise<string> {
    const value = await characteristic.readValue();
    return new TextDecoder().decode(value);
  }

  public getCharacteristicName(uuid: string): string {
    return this.gattLookup.getCharacteristicName(uuid);
  }

  public async readAllCharacteristics(device: BluetoothDevice): Promise<void> {
    if (!device.gatt) {
      throw new Error('Device not connected');
    }

    try {
      const services = await device.gatt.getPrimaryServices();
      for (const service of services) {
        try {
          const characteristics = await service.getCharacteristics();
          for (const characteristic of characteristics) {
            try {
              if (characteristic.properties.read) {
                const value = await characteristic.readValue();
                this.characteristicValues.set(characteristic.uuid, value);
                this.emit('characteristicRead', {
                  uuid: characteristic.uuid,
                  name: this.getCharacteristicName(characteristic.uuid),
                  properties: Object.keys(characteristic.properties),
                  value,
                  lastUpdated: new Date()
                });
              }
            } catch (error) {
              console.error(`Failed to read characteristic ${characteristic.uuid}:`, error);
            }
          }
        } catch (error) {
          console.error(`Failed to get characteristics for service ${service.uuid}:`, error);
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to read characteristics');
      this.emit('error', err);
      throw err;
    }
  }

  public getCharacteristicValue(uuid: string): DataView | undefined {
    return this.characteristicValues.get(uuid);
  }

  public async startNotifications(
    device: BluetoothDevice,
    serviceUuid: string,
    characteristicUuid: string
  ): Promise<void> {
    if (!device.gatt) {
      throw new Error('Device not connected');
    }

    try {
      const service = await device.gatt.getPrimaryService(serviceUuid);
      const characteristic = await service.getCharacteristic(characteristicUuid);
      
      const key = `${device.id}-${serviceUuid}-${characteristicUuid}`;
      const notificationHandler = (event: Event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        const value = target.value;
        if (value) {
          this.characteristicValues.set(characteristicUuid, value);
          this.emit('characteristicRead', {
            uuid: characteristicUuid,
            name: this.getCharacteristicName(characteristicUuid),
            properties: Object.keys(characteristic.properties),
            value,
            lastUpdated: new Date()
          });
        }
      };

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', notificationHandler);
      this.characteristicNotifications.set(key, notificationHandler);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to start notifications');
      this.emit('error', err);
      throw err;
    }
  }

  public async stopNotifications(
    device: BluetoothDevice,
    serviceUuid: string,
    characteristicUuid: string
  ): Promise<void> {
    if (!device.gatt) {
      throw new Error('Device not connected');
    }

    try {
      const service = await device.gatt.getPrimaryService(serviceUuid);
      const characteristic = await service.getCharacteristic(characteristicUuid);
      
      const key = `${device.id}-${serviceUuid}-${characteristicUuid}`;
      const notificationHandler = this.characteristicNotifications.get(key);
      
      if (notificationHandler) {
        characteristic.removeEventListener('characteristicvaluechanged', notificationHandler);
        this.characteristicNotifications.delete(key);
        await characteristic.stopNotifications();
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to stop notifications');
      this.emit('error', err);
      throw err;
    }
  }

  public async subscribeToCharacteristic(
    device: BluetoothDevice,
    serviceUuid: string,
    characteristicUuid: string,
    callback: (value: string) => void
  ): Promise<void> {
    if (!device.gatt) {
      throw new Error('Device not connected');
    }

    try {
      const service = await device.gatt.getPrimaryService(serviceUuid);
      const characteristic = await service.getCharacteristic(characteristicUuid);

      // Check if notifications are supported
      if (!characteristic.properties.notify) {
        throw new Error('Characteristic does not support notifications');
      }

      const key = `${device.id}-${serviceUuid}-${characteristicUuid}`;
      
      // Add callback to subscriptions
      if (!this.characteristicSubscriptions.has(key)) {
        this.characteristicSubscriptions.set(key, new Set());
      }
      this.characteristicSubscriptions.get(key)?.add(callback);

      // Set up notification handler if not already set up
      if (!this.characteristicNotifications.has(key)) {
        const notificationHandler = (event: Event) => {
          const target = event.target as BluetoothRemoteGATTCharacteristic;
          const value = target.value;
          if (value) {
            // Get custom formatter if available
            const customChar = this.customCharacteristics.find(c => c.uuid === characteristicUuid);
            const formattedValue = customChar?.valueFormatter 
              ? customChar.valueFormatter(value)
              : new TextDecoder().decode(value);

            // Call all subscribed callbacks
            this.characteristicSubscriptions.get(key)?.forEach(cb => cb(formattedValue));
          }
        };

        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', notificationHandler);
        this.characteristicNotifications.set(key, notificationHandler);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to subscribe to characteristic');
      this.emit('error', err);
      throw err;
    }
  }

  public async unsubscribeFromCharacteristic(
    device: BluetoothDevice,
    serviceUuid: string,
    characteristicUuid: string,
    callback: (value: string) => void
  ): Promise<void> {
    const key = `${device.id}-${serviceUuid}-${characteristicUuid}`;
    this.characteristicSubscriptions.get(key)?.delete(callback);

    // If no more callbacks, stop notifications
    if (this.characteristicSubscriptions.get(key)?.size === 0) {
      const notificationHandler = this.characteristicNotifications.get(key);
      if (notificationHandler && device.gatt) {
        try {
          const service = await device.gatt.getPrimaryService(serviceUuid);
          const characteristic = await service.getCharacteristic(characteristicUuid);
          characteristic.removeEventListener('characteristicvaluechanged', notificationHandler);
          await characteristic.stopNotifications();
        } catch (error) {
          console.error('Error stopping notifications:', error);
        }
      }
      this.characteristicNotifications.delete(key);
      this.characteristicSubscriptions.delete(key);
    }
  }

  async pairDevice(device: BluetoothDevice): Promise<void> {
    try {
      console.log('Pairing device:', device);
      const pairedDevice = await device.gatt?.connect();
      if (!pairedDevice) {
        throw new Error('Failed to pair with device');
      }

      // Add the device to our list
      const deviceInfo: Device = {
        id: device.id,
        name: device.name || 'Unknown Device',
        isConnected: false,
        isPaired: true,
        lastSeen: new Date(),
        services: [],
        characteristics: []
      };

      this.devices.push(deviceInfo);
      await this.saveDevices();
      this.emit('devicesChanged', [...this.devices]);
      this.emit('devicePaired', deviceInfo);
    } catch (error) {
      console.error('Error pairing device:', error);
      this.emit('error', {
        type: 'pairing',
        message: error instanceof Error ? error.message : 'Failed to pair with device'
      });
      throw error;
    }
  }
} 