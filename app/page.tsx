
import { OpenInV0Button } from "@/components/open-in-v0-button"
import { BluetoothDeviceList } from "@/registry/new-york/blocks/bluetooth/bluetooth-device-list"
import { BluetoothLogConsole } from "@/registry/new-york/blocks/bluetooth/bluetooth-log-console"
import { BluetoothStatus } from "@/registry/new-york/blocks/bluetooth/bluetooth-status"
import { BluetoothToolbar } from "@/registry/new-york/blocks/bluetooth/bluetooth-toolbar"
import * as React from "react"
// This page displays items from the custom registry.
// You are free to implement this with your own design as needed.

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto flex flex-col min-h-svh px-4 py-8 gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Custom Registry</h1>
        <p className="text-muted-foreground">
          A custom registry for distributing code using shadcn.
        </p>
      </header>
      <main className="flex flex-col flex-1 gap-8">
        {/* custom components */}
        
        <CardWrapper title="A list of bluetooth devices." name="bluetooth-device-list">
          <BluetoothDeviceList />
        </CardWrapper>

        <CardWrapper title="A list of bluetooth devices." name="bluetooth-device-list">
          <BluetoothLogConsole />
        </CardWrapper>

        <CardWrapper title="A bluetooth status component. Hover over the status to see the different states." name="bluetooth-status">
          <BluetoothStatus />
          <BluetoothStatus showLegend />
          {/* <BluetoothPairingButton /> */}
        </CardWrapper>
        
        <CardWrapper title="A toolbar for bluetooth devices." name="bluetooth-toolbar">
          <BluetoothToolbar />
        </CardWrapper>
      </main>
    </div>
  )
}


const CardWrapper = ({ children, title, name }: { children: React.ReactNode, title: string, name: string }) => {
  return (
    <div className="flex flex-col gap-4 border rounded-lg p-4 relative">
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-muted-foreground sm:pl-3">
          {title}
        </h2>
        <OpenInV0Button name={name} className="w-fit" />
      </div>
      <div className="flex items-center justify-center py-8 relative">
        {children}
      </div>
    </div>

  )
}