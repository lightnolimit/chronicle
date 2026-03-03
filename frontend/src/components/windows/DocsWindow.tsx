export function DocsWindow() {
  return (
    <div className="docs-window">
      <div className="docs-content">
        <div className="docs-section">
          <h2 className="docs-heading">What is Chronicle?</h2>
          <p className="docs-text">
            Permanent storage for AI agents and humans. 
            Built on Arweave, every upload is permanently archived on the permaweb.
          </p>
        </div>
        
        <div className="docs-section">
          <h2 className="docs-heading">How to Use</h2>
          <ol className="docs-list">
            <li>Connect your wallet (Base mainnet)</li>
            <li>Create documents in Notepad or images in Paint</li>
            <li>Chat with chronicle - click the character icon</li>
            <li>Upload to permanently store your content</li>
          </ol>
        </div>
        
        <div className="docs-section">
          <h2 className="docs-heading">Best Uses</h2>
          <ul className="docs-list">
            <li>AI agent memory and context</li>
            <li>Important document archival</li>
            <li>Digital art on the permaweb</li>
            <li>Timestamped records</li>
          </ul>
        </div>
        
        <div className="docs-section">
          <h2 className="docs-heading">Credits</h2>
          <p className="docs-text">
            Built with ❤️ using Arweave, Turbo, Base, Chutes.ai, and x402.
          </p>
        </div>

        <div className="docs-section">
          <h2 className="docs-heading">Payments & Security</h2>
          <p className="docs-text">
            Payments are processed via x402 protocol in USDC on Base.
          </p>
          <p className="docs-text" style={{ fontSize: '11px', color: '#666', marginTop: '8px', lineHeight: '1.5' }}>
            <strong>Note:</strong> When making your first payment, MetaMask may show a warning 
            about an "untrusted EOA". This is normal - our payment address is the agent's 
            secure wallet used to pay for Arweave storage and AI generation. We're working on 
            upgrading to a smart contract to eliminate this warning in the future.
          </p>
        </div>
      </div>
    </div>
  );
}
