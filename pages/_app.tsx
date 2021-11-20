import { AppProps } from "next/app";
import "./font.css";
import "./global.css";

const App = ({ Component, pageProps }: AppProps) => {
  return <Component {...pageProps} />;
};

export default App;
