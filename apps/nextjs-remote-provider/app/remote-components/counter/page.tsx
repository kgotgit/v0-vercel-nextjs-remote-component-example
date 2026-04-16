import { ExposeRemoteComponent } from "remote-components/remote/nextjs/app";
import { CounterServer } from "./counter.server";

export default function CounterComponent() {
  return (
    <ExposeRemoteComponent>
      <CounterServer />
    </ExposeRemoteComponent>
  );
}
