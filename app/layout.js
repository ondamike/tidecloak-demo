import "./tailwind.css";
import { Provider } from "./context/context";
import Nav from "./components/nav";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>TideCloak Demo</title>
          <Nav/>
          {children}
        
      </body>
    </html>
  );
}
