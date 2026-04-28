import { ExposeRemoteComponent } from "remote-components/remote/nextjs/app";
import { HeaderServer } from "./header.server";

export default function HeaderComponent() {
  return (
    <ExposeRemoteComponent>
      <HeaderServer />
    </ExposeRemoteComponent>
  );
}
