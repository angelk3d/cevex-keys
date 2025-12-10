export default function HomePage() {
  return (
    <div style={{
      background: '#0a0a0a',
      color: 'white',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial'
    }}>
      <h1>🔑 Cevex.gg Key System</h1>
      <p>Activation key distribution service</p>
      <div style={{ marginTop: '30px' }}>
        <a href="/key" style={{
          background: '#00ffaa',
          color: 'black',
          padding: '12px 24px',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 'bold'
        }}>
          Get Your Key
        </a>
      </div>
      <p style={{ marginTop: '20px', color: '#aaa', fontSize: '14px' }}>
        Keys valid for 9 hours • HWID protected
      </p>
    </div>
  );
}
