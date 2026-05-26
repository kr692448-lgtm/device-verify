export const metadata = {
  title: "Device Verification — NxtZen",
  description: "Secure device verification portal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#030712" />
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body style={{ margin: 0, background: "#030712" }}>
        {children}
      </body>
    </html>
  );
}
