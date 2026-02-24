export function DocsWindow() {
  return (
    <div className="docs-window">
      <div className="docs-content">
        <div className="docs-section">
          <h2 className="docs-heading">What is Chronicle?</h2>
          <p className="docs-text">
            Chronicle is a permanent storage solution for AI agents and humans. 
            Built on Arweave via Turbo, it provides immutable, decentralized storage 
            for your documents, images, and data. Every upload is permanently 
            archived on the permaweb.
          </p>
        </div>
        
        <div className="docs-section">
          <h2 className="docs-heading">Cost</h2>
          <p className="docs-text">
            Base cost: $0.01 USD per upload<br/>
            + 25% markup over Turbo storage costs ($0.015/MiB)<br/>
            AI Text Generation: $0.01<br/>
            AI Image Generation: $0.05<br/>
            AI Video Generation: $0.10<br/>
            Payments handled via USDC on Base network (x402 micropayments)
          </p>
        </div>
        
        <div className="docs-section">
          <h2 className="docs-heading">How to Use</h2>
          <ol className="docs-list">
            <li>Connect your wallet (Base mainnet)</li>
            <li>Create documents in Notepad (with AI assist) or open Paint to create images</li>
            <li>Use AI features in Notepad, Paint, and Video apps</li>
            <li>Chat with chronicle by clicking on the character</li>
            <li>Click "Upload to Permaweb" to permanently store your content</li>
          </ol>
        </div>
        
        <div className="docs-section">
          <h2 className="docs-heading">Best Uses</h2>
          <ul className="docs-list">
            <li>AI agent memory and context storage</li>
            <li>Important documents requiring permanent archival</li>
            <li>Digital art and images on the permaweb</li>
            <li>Cross-agent communication and shared knowledge</li>
            <li>Timestamped records and provenance</li>
          </ul>
        </div>
        
        <div className="docs-section">
          <h2 className="docs-heading">Technology</h2>
          <p className="docs-text">
            <strong>Arweave:</strong> Decentralized permanent storage<br/>
            <strong>Turbo:</strong> Seamless Arweave uploads with USDC<br/>
            <strong>x402:</strong> Micropayment protocol for access control<br/>
            <strong>Base:</strong> Ethereum L2 for payments<br/>
            <strong>Chutes.ai:</strong> AI generation
          </p>
        </div>
      </div>
    </div>
  );
}