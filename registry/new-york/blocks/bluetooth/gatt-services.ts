export interface GattService {
  uuid: string;
  name: string;
}

export interface GattCharacteristic {
  uuid: string;
  name: string;
}

export class GattLookup {
  private static instance: GattLookup;
  private serviceMap: Map<string, GattService>;
  private characteristicMap: Map<string, GattCharacteristic>;

  private constructor() {
    // Create maps for quick lookup by first segment
    this.serviceMap = new Map();
    this.characteristicMap = new Map();

    // Populate service map
    GATT_SERVICES.map(service => {
      const firstSegment = this.getFirstSegment(service.uuid);
      this.serviceMap.set(firstSegment, service);
    });

    // Populate characteristic map
    GATT_CHARACTERISTICS.map(char => {
      const firstSegment = this.getFirstSegment(char.uuid);

      this.characteristicMap.set(firstSegment, char);
    });

    console.log("serviceMap", this.serviceMap);
    console.log("characteristicMap", this.characteristicMap);
  }

  public static getInstance(): GattLookup {
    if (!GattLookup.instance) {
      GattLookup.instance = new GattLookup();
    }
    return GattLookup.instance;
  }
 
  private getFirstSegment(uuid: string): string {
    // Get the characters until the first '-'
    // console.log("uuid", uuid);
    // if the uuid doesn't have a '-' then return the uuid
    if (!uuid.includes('-')) {
      return uuid.toUpperCase();
    }
    const firstSegment = uuid.substring(0, uuid.indexOf('-'));
    return firstSegment.toUpperCase();
  }

  public getServiceByFirstSegment(uuid: string): GattService | undefined {
    const firstSegment = this.getFirstSegment(uuid);
    // console.log("firstSegment", firstSegment);
    return this.serviceMap.get(firstSegment);
  }

  public getCharacteristicByFirstSegment(uuid: string): GattCharacteristic | undefined {
    const firstSegment = this.getFirstSegment(uuid);
    // console.log("firstSegment", firstSegment, this.characteristicMap);
    return this.characteristicMap.get(firstSegment);
  }

  public getServiceName(uuid: string): string {
    const service = this.getServiceByFirstSegment(uuid);
    return service?.name || uuid;
  }

  public getCharacteristicName(uuid: string): string {
    const characteristic = this.getCharacteristicByFirstSegment(uuid);
    console.log("characteristic", characteristic, uuid);
    return characteristic?.name || uuid;
  }
}

export const GATT_SERVICES: GattService[] = [
  { uuid: '00001800', name: 'Generic Access' },
  { uuid: '00001801', name: 'Generic Attribute' },
  { uuid: '00001802', name: 'Immediate Alert' },
  { uuid: '00001803', name: 'Link Loss' },
  { uuid: '00001804', name: 'Tx Power' },
  { uuid: '00001805', name: 'Current Time' },
  { uuid: '00001806', name: 'Reference Time Update' },
  { uuid: '00001807', name: 'Next DST Change' },
  { uuid: '00001808', name: 'Glucose' },
  { uuid: '00001809', name: 'Health Thermometer' },
  { uuid: '0000180A', name: 'Device Information' },
  { uuid: '0000180D', name: 'Heart Rate' },
  { uuid: '0000180E', name: 'Phone Alert Status' },
  { uuid: '0000180F', name: 'Battery Service' },
  { uuid: '00001810', name: 'Blood Pressure' },
  { uuid: '00001811', name: 'Alert Notification' },
  { uuid: '00001812', name: 'Human Interface Device' },
  { uuid: '00001813', name: 'Scan Parameters' },
  { uuid: '00001814', name: 'Running Speed and Cadence' },
  { uuid: '00001815', name: 'Automation IO' },
  { uuid: '00001816', name: 'Cycling Speed and Cadence' },
  { uuid: '00001818', name: 'Cycling Power' },
  { uuid: '00001819', name: 'Location and Navigation' },
  { uuid: '0000181A', name: 'Environmental Sensing' },
  { uuid: '0000181B', name: 'Body Composition' },
  { uuid: '0000181C', name: 'User Data' },
  { uuid: '0000181D', name: 'Weight Scale' },
  { uuid: '0000181E', name: 'Bond Management' },
  { uuid: '0000181F', name: 'Continuous Glucose Monitoring' },
  { uuid: '00001820', name: 'Internet Protocol Support' },
  { uuid: '00001821', name: 'Indoor Positioning' },
  { uuid: '00001822', name: 'Pulse Oximeter' },
  { uuid: '00001823', name: 'HTTP Proxy' },
  { uuid: '00001824', name: 'Transport Discovery' },
  { uuid: '00001825', name: 'Object Transfer' },
  { uuid: '00001826', name: 'Fitness Machine' },
  { uuid: '00001827', name: 'Mesh Provisioning' },
  { uuid: '00001828', name: 'Mesh Proxy' },
  { uuid: '00001829', name: 'Reconnection Configuration' }
];

export const GATT_CHARACTERISTICS: GattCharacteristic[] = [
  { uuid: '00002a00', name: 'Device Name' },
  { uuid: '00002a01', name: 'Appearance' },
  { uuid: '00002a02', name: 'Peripheral Privacy Flag' },
  { uuid: '00002a03', name: 'Reconnection Address' },
  { uuid: '00002a04', name: 'Peripheral Preferred Connection Parameters' },
  { uuid: '00002a05', name: 'Service Changed' },
  { uuid: '00002a06', name: 'Alert Level' },
  { uuid: '00002a07', name: 'Tx Power Level' },
  { uuid: '00002a08', name: 'Date Time' },
  { uuid: '00002a09', name: 'Day of Week' },
  { uuid: '00002a0a', name: 'Day Date Time' },
  { uuid: '00002a0b', name: 'Exact Time 100' },
  { uuid: '00002a0c', name: 'Exact Time 256' },
  { uuid: '00002a0d', name: 'DST Offset' },
  { uuid: '00002a0e', name: 'Time Zone' },
  { uuid: '00002a0f', name: 'Local Time Information' },
  { uuid: '00002a10', name: 'Secondary Time Zone' },
  { uuid: '00002a11', name: 'Time with DST' },
  { uuid: '00002a12', name: 'Time Accuracy' },
  { uuid: '00002a13', name: 'Time Source' },
  { uuid: '00002a14', name: 'Reference Time Information' },
  { uuid: '00002a15', name: 'Time Broadcast' },
  { uuid: '00002a16', name: 'Time Update Control Point' },
  { uuid: '00002a17', name: 'Time Update State' },
  { uuid: '00002a18', name: 'Glucose Measurement' },
  { uuid: '00002a19', name: 'Battery Level' },
  { uuid: '00002a1a', name: 'Battery Power State' },
  { uuid: '00002a1b', name: 'Battery Level State' },
  { uuid: '00002a1c', name: 'Temperature Measurement' },
  { uuid: '00002a1d', name: 'Temperature Type' },
  { uuid: '00002a1e', name: 'Intermediate Temperature' },
  { uuid: '00002a1f', name: 'Temperature Celsius' },
  { uuid: '00002a20', name: 'Temperature Fahrenheit' },
  { uuid: '00002a21', name: 'Measurement Interval' },
  { uuid: '00002a22', name: 'Boot Keyboard Input Report' },
  { uuid: '00002a23', name: 'System ID' },
  { uuid: '00002a24', name: 'Model Number String' },
  { uuid: '00002a25', name: 'Serial Number String' },
  { uuid: '00002a26', name: 'Firmware Revision String' },
  { uuid: '00002a27', name: 'Hardware Revision String' },
  { uuid: '00002a28', name: 'Software Revision String' },
  { uuid: '00002a29', name: 'Manufacturer Name String' },
  { uuid: '00002a2a', name: 'IEEE 11073-20601 Regulatory Certification Data List' },
  { uuid: '00002a2b', name: 'Current Time' },
  { uuid: '00002a2c', name: 'Magnetic Declination' },
  { uuid: '00002a2f', name: 'Position 2D' },
  { uuid: '00002a30', name: 'Position 3D' },
  { uuid: '00002a31', name: 'Scan Refresh' },
  { uuid: '00002a32', name: 'Boot Keyboard Output Report' },
  { uuid: '00002a33', name: 'Boot Mouse Input Report' },
  { uuid: '00002a34', name: 'Glucose Measurement Context' },
  { uuid: '00002a35', name: 'Blood Pressure Measurement' },
  { uuid: '00002a36', name: 'Intermediate Cuff Pressure' },
  { uuid: '00002a37', name: 'Heart Rate Measurement' },
  { uuid: '00002a38', name: 'Body Sensor Location' },
  { uuid: '00002a39', name: 'Heart Rate Control Point' },
  { uuid: '00002a3a', name: 'Removable' },
  { uuid: '00002a3b', name: 'Service Required' },
  { uuid: '00002a3c', name: 'Scientific Temperature Celsius' },
  { uuid: '00002a3d', name: 'String' },
  { uuid: '00002a3e', name: 'Network Availability' },
  { uuid: '00002a3f', name: 'Alert Status' },
  { uuid: '00002a40', name: 'Ringer Control point' },
  { uuid: '00002a41', name: 'Ringer Setting' },
  { uuid: '00002a42', name: 'Alert Category ID Bit Mask' },
  { uuid: '00002a43', name: 'Alert Category ID' },
  { uuid: '00002a44', name: 'Alert Notification Control Point' },
  { uuid: '00002a45', name: 'Unread Alert Status' },
  { uuid: '00002a46', name: 'New Alert' },
  { uuid: '00002a47', name: 'Supported New Alert Category' },
  { uuid: '00002a48', name: 'Supported Unread Alert Category' },
  { uuid: '00002a49', name: 'Blood Pressure Feature' },
  { uuid: '00002a4a', name: 'HID Information' },
  { uuid: '00002a4b', name: 'Report Map' },
  { uuid: '00002a4c', name: 'HID Control Point' },
  { uuid: '00002a4d', name: 'Report' },
  { uuid: '00002a4e', name: 'Protocol Mode' },
  { uuid: '00002a4f', name: 'Scan Interval Window' },
  { uuid: '00002a50', name: 'PnP ID' },
  { uuid: '00002a51', name: 'Glucose Feature' },
  { uuid: '00002a52', name: 'Record Access Control Point' },
  { uuid: '00002a53', name: 'RSC Measurement' },
  { uuid: '00002a54', name: 'RSC Feature' },
  { uuid: '00002a55', name: 'SC Control Point' },
  { uuid: '00002a56', name: 'Digital' },
  { uuid: '00002a57', name: 'Digital Output' },
  { uuid: '00002a58', name: 'Analog' },
  { uuid: '00002a59', name: 'Analog Output' },
  { uuid: '00002a5a', name: 'Aggregate' },
  { uuid: '00002a5b', name: 'CSC Measurement' },
  { uuid: '00002a5c', name: 'CSC Feature' },
  { uuid: '00002a5d', name: 'Sensor Location' },
  { uuid: '00002a5e', name: 'PLX Spot-Check Measurement' },
  { uuid: '00002a5f', name: 'PLX Continuous Measurement Characteristic' },
  { uuid: '00002a60', name: 'PLX Features' },
  { uuid: '00002a62', name: 'Pulse Oximetry Control Point' },
  { uuid: '00002a63', name: 'Cycling Power Measurement' },
  { uuid: '00002a64', name: 'Cycling Power Vector' },
  { uuid: '00002a65', name: 'Cycling Power Feature' },
  { uuid: '00002a66', name: 'Cycling Power Control Point' },
  { uuid: '00002a67', name: 'Location and Speed Characteristic' },
  { uuid: '00002a68', name: 'Navigation' },
  { uuid: '00002a69', name: 'Position Quality' },
  { uuid: '00002a6a', name: 'LN Feature' },
  { uuid: '00002a6b', name: 'LN Control Point' },
  { uuid: '00002a6c', name: 'Elevation' },
  { uuid: '00002a6d', name: 'Pressure' },
  { uuid: '00002a6e', name: 'Temperature' },
  { uuid: '00002a6f', name: 'Humidity' },
  { uuid: '00002a70', name: 'True Wind Speed' },
  { uuid: '00002a71', name: 'True Wind Direction' },
  { uuid: '00002a72', name: 'Apparent Wind Speed' },
  { uuid: '00002a73', name: 'Apparent Wind Direction' },
  { uuid: '00002a74', name: 'Gust Factor' },
  { uuid: '00002a75', name: 'Pollen Concentration' },
  { uuid: '00002a76', name: 'UV Index' },
  { uuid: '00002a77', name: 'Irradiance' },
  { uuid: '00002a78', name: 'Rainfall' },
  { uuid: '00002a79', name: 'Wind Chill' },
  { uuid: '00002a7a', name: 'Heat Index' },
  { uuid: '00002a7b', name: 'Dew Point' },
  { uuid: '00002a7d', name: 'Descriptor Value Changed' },
  { uuid: '00002a7e', name: 'Aerobic Heart Rate Lower Limit' },
  { uuid: '00002a7f', name: 'Aerobic Threshold' },
  { uuid: '00002a80', name: 'Age' },
  { uuid: '00002a81', name: 'Anaerobic Heart Rate Lower Limit' },
  { uuid: '00002a82', name: 'Anaerobic Heart Rate Upper Limit' },
  { uuid: '00002a83', name: 'Anaerobic Threshold' },
  { uuid: '00002a84', name: 'Aerobic Heart Rate Upper Limit' },
  { uuid: '00002a85', name: 'Date of Birth' },
  { uuid: '00002a86', name: 'Date of Threshold Assessment' },
  { uuid: '00002a87', name: 'Email Address' },
  { uuid: '00002a88', name: 'Fat Burn Heart Rate Lower Limit' },
  { uuid: '00002a89', name: 'Fat Burn Heart Rate Upper Limit' },
  { uuid: '00002a8a', name: 'First Name' },
  { uuid: '00002a8b', name: 'Five Zone Heart Rate Limits' },
  { uuid: '00002a8c', name: 'Gender' },
  { uuid: '00002a8d', name: 'Heart Rate Max' },
  { uuid: '00002a8e', name: 'Height' },
  { uuid: '00002a8f', name: 'Hip Circumference' },
  { uuid: '00002a90', name: 'Last Name' },
  { uuid: '00002a91', name: 'Maximum Recommended Heart Rate' },
  { uuid: '00002a92', name: 'Resting Heart Rate' },
  { uuid: '00002a93', name: 'Sport Type for Aerobic and Anaerobic Thresholds' },
  { uuid: '00002a94', name: 'Three Zone Heart Rate Limits' },
  { uuid: '00002a95', name: 'Two Zone Heart Rate Limit' },
  { uuid: '00002a96', name: 'VO2 Max' },
  { uuid: '00002a97', name: 'Waist Circumference' },
  { uuid: '00002a98', name: 'Weight' },
  { uuid: '00002a99', name: 'Database Change Increment' },
  { uuid: '00002a9a', name: 'User Index' },
  { uuid: '00002a9b', name: 'Body Composition Feature' },
  { uuid: '00002a9c', name: 'Body Composition Measurement' },
  { uuid: '00002a9d', name: 'Weight Measurement' },
  { uuid: '00002a9e', name: 'Weight Scale Feature' },
  { uuid: '00002a9f', name: 'User Control Point' },
  { uuid: '00002aa0', name: 'Magnetic Flux Density - 2D' },
  { uuid: '00002aa1', name: 'Magnetic Flux Density - 3D' },
  { uuid: '00002aa2', name: 'Language' },
  { uuid: '00002aa3', name: 'Barometric Pressure Trend' },
  { uuid: '00002aa4', name: 'Bond Management Control Point' },
  { uuid: '00002aa5', name: 'Bond Management Features' },
  { uuid: '00002aa6', name: 'Central Address Resolution' },
  { uuid: '00002aa7', name: 'CGM Measurement' },
  { uuid: '00002aa8', name: 'CGM Feature' },
  { uuid: '00002aa9', name: 'CGM Status' },
  { uuid: '00002aaa', name: 'CGM Session Start Time' },
  { uuid: '00002aab', name: 'CGM Session Run Time' },
  { uuid: '00002aac', name: 'CGM Specific Ops Control Point' },
  { uuid: '00002aad', name: 'Indoor Positioning Configuration' },
  { uuid: '00002aae', name: 'Latitude' },
  { uuid: '00002aaf', name: 'Longitude' },
  { uuid: '00002ab0', name: 'Local North Coordinate' },
  { uuid: '00002ab1', name: 'Local East Coordinate' },
  { uuid: '00002ab2', name: 'Floor Number' },
  { uuid: '00002ab3', name: 'Altitude' },
  { uuid: '00002ab4', name: 'Uncertainty' },
  { uuid: '00002ab5', name: 'Location Name' },
  { uuid: '00002ab6', name: 'URI' },
  { uuid: '00002ab7', name: 'HTTP Headers' },
  { uuid: '00002ab8', name: 'HTTP Status Code' },
  { uuid: '00002ab9', name: 'HTTP Entity Body' },
  { uuid: '00002aba', name: 'HTTP Control Point' },
  { uuid: '00002abb', name: 'HTTPS Security' },
  { uuid: '00002abc', name: 'TDS Control Point' },
  { uuid: '00002abd', name: 'OTS Feature' },
  { uuid: '00002abe', name: 'Object Name' },
  { uuid: '00002abf', name: 'Object Type' },
  { uuid: '00002ac0', name: 'Object Size' },
  { uuid: '00002ac1', name: 'Object First-Created' },
  { uuid: '00002ac2', name: 'Object Last-Modified' },
  { uuid: '00002ac3', name: 'Object ID' },
  { uuid: '00002ac4', name: 'Object Properties' },
  { uuid: '00002ac5', name: 'Object Action Control Point' },
  { uuid: '00002ac6', name: 'Object List Control Point' },
  { uuid: '00002ac7', name: 'Object List Filter' },
  { uuid: '00002ac8', name: 'Object Changed' },
  { uuid: '00002ac9', name: 'Resolvable Private Address Only' },
  { uuid: '00002acc', name: 'Fitness Machine Feature' },
  { uuid: '00002acd', name: 'Treadmill Data' },
  { uuid: '00002ace', name: 'Cross Trainer Data' },
  { uuid: '00002acf', name: 'Step Climber Data' },
  { uuid: '00002ad0', name: 'Stair Climber Data' },
  { uuid: '00002ad1', name: 'Rower Data' },
  { uuid: '00002ad2', name: 'Indoor Bike Data' },
  { uuid: '00002ad3', name: 'Training Status' },
  { uuid: '00002ad4', name: 'Supported Speed Range' },
  { uuid: '00002ad5', name: 'Supported Inclination Range' },
  { uuid: '00002ad6', name: 'Supported Resistance Level Range' },
  { uuid: '00002ad7', name: 'Supported Heart Rate Range' },
  { uuid: '00002ad8', name: 'Supported Power Range' },
  { uuid: '00002ad9', name: 'Fitness Machine Control Point' },
  { uuid: '00002ada', name: 'Fitness Machine Status' },
  { uuid: '00002aed', name: 'Date UTC' },
  { uuid: '00002b1d', name: 'RC Feature' },
  { uuid: '00002b1e', name: 'RC Settings' },
  { uuid: '00002b1f', name: 'Reconnection Configuration Control Point' }
]; 