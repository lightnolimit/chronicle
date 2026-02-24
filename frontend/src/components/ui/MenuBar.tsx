import { useState, type ReactNode } from 'react';
import { useAccount, useDisconnect } from 'wagmi';

interface MenuBarProps {
  onOpenWallet: () => void;
  isDarkMode: boolean;
  onToggleDark: () => void;
  showHidden?: boolean;
  onToggleShowHidden?: () => void;
  chainId?: number;
}

interface MenuItem {
  label: string | ReactNode;
  action?: () => void;
  disabled?: boolean;
}

interface Menu {
  id: string;
  label: string | ReactNode;
  items: MenuItem[];
}

export function MenuBar({ onOpenWallet, isDarkMode, onToggleDark, showHidden, onToggleShowHidden, chainId }: MenuBarProps) {
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const getNetworkLabel = (id?: number) => {
    if (!id) return null;
    if (id === 8453) return { label: 'BASE (MAINNET)', class: 'network-mainnet' };
    if (id === 84532) return { label: 'BASE (SEPOLIA)', class: 'network-testnet' };
    return { label: `NET-${id}`, class: 'network-unknown' };
  };

  const network = getNetworkLabel(chainId);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConnect = () => {
    setShowMenu(null);
    onOpenWallet();
  };

  const handleDisconnect = () => {
    setShowMenu(null);
    disconnect();
  };

  const handleToggleDark = () => {
    setShowMenu(null);
    onToggleDark();
  };

  const handleToggleShowHidden = () => {
    setShowMenu(null);
    onToggleShowHidden?.();
  };

  const menus: Menu[] = [
    { 
      id: 'apple', 
      label: <img src="/chronicle-pfp-2.png" alt="chronicle" className="menu-logo" />, 
      items: [
        { label: 'About chronicle...', action: () => {} },
        { label: '────────────', disabled: true },
        { label: 'Version 1.0.0', disabled: true },
      ]
    },
    { id: 'file', label: 'File', items: [
      { label: 'New Document', action: () => {} },
      { label: 'Open...', action: () => {} },
      { label: '────────────', disabled: true },
      { label: 'Close', action: () => {} },
    ]},
    { id: 'edit', label: 'Edit', items: [
      { label: 'Undo', action: () => {} },
      { label: 'Redo', action: () => {} },
      { label: '────────────', disabled: true },
      { label: 'Cut', action: () => {} },
      { label: 'Copy', action: () => {} },
      { label: 'Paste', action: () => {} },
      { label: 'Select All', action: () => {} },
    ]},
    { id: 'view', label: 'View', items: [
      { label: 'Clean Up', action: () => {} },
      { label: '────────────', disabled: true },
      { label: isDarkMode ? 'Light Mode' : 'Dark Mode', action: handleToggleDark },
      ...(onToggleShowHidden ? [
        { label: showHidden ? 'Hide Hidden Files' : 'Show Hidden Files', action: handleToggleShowHidden },
      ] : []),
      { label: '────────────', disabled: true },
      { label: 'Enter Full Screen', action: () => {} },
    ]},
    { id: 'wallet', label: (isConnected ? formatAddress(address!) : 'Wallet') + (network ? ` (${network.label})` : ''), items: [
      isConnected 
        ? { label: `Connected: ${formatAddress(address!)}`, disabled: true }
        : { label: 'Connect Wallet...', action: handleConnect },
      ...(isConnected ? [
        ...(network ? [{ label: network.label, disabled: true }] : []),
        { label: '────────────', disabled: true },
        { label: 'Disconnect', action: handleDisconnect },
      ] : []),
    ]},
  ];

  return (
    <header className="mac_bar">
      <ul className="menu">
        {menus.map(menu => (
          <li 
            key={menu.id}
            onMouseEnter={() => showMenu && setShowMenu(menu.id)}
            onClick={() => setShowMenu(showMenu === menu.id ? null : menu.id)}
          >
            <span className={showMenu === menu.id ? 'active' : ''}>{menu.label}</span>
            {showMenu === menu.id && (
              <ul className="dropdown">
                {menu.items.map((item, i) => (
                  <li 
                    key={i} 
                    className={item.disabled ? 'menu-title' : ''}
                    onClick={() => {
                      if (!item.disabled && item.action) item.action();
                      setShowMenu(null);
                    }}
                  >
                    {item.label}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </header>
  );
}