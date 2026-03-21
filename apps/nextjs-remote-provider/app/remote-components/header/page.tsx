import { RemoteComponent } from "remote-components/next";
import { HeaderServer } from "./header.server";

export default function HeaderComponent() {
  return (
    <RemoteComponent>
      <HeaderServer />
    </RemoteComponent>
  );
}
