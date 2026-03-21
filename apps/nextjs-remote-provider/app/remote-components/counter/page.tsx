import { RemoteComponent } from "remote-components/next";
import { CounterServer } from "./counter.server";

export default function CounterComponent() {
  return (
    <RemoteComponent>
      <CounterServer />
    </RemoteComponent>
  );
}
