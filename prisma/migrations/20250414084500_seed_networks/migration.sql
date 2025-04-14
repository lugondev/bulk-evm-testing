-- Network seeds
INSERT INTO Network (
		id,
		name,
		chainId,
		symbol,
		isTestnet,
		createdAt,
		updatedAt
	)
VALUES (
		'clgzp0u0h0000qw1234567890',
		'Ethereum Mainnet',
		1,
		'ETH',
		false,
		datetime('now'),
		datetime('now')
	),
	(
		'clgzp0u0h0001qw1234567891',
		'Goerli Testnet',
		5,
		'ETH',
		true,
		datetime('now'),
		datetime('now')
	),
	(
		'clgzp0u0h0002qw1234567892',
		'Sepolia Testnet',
		11155111,
		'ETH',
		true,
		datetime('now'),
		datetime('now')
	),
	(
		'clgzp0u0h0003qw1234567893',
		'BSC Mainnet',
		56,
		'BNB',
		false,
		datetime('now'),
		datetime('now')
	),
	(
		'clgzp0u0h0004qw1234567894',
		'BSC Testnet',
		97,
		'BNB',
		true,
		datetime('now'),
		datetime('now')
	);
-- RPC URLs for each network
INSERT INTO RpcUrl (
		id,
		url,
		isActive,
		networkId,
		createdAt,
		updatedAt
	)
VALUES -- Ethereum Mainnet
	(
		'clgzp0u0h1000qw1234567890',
		'https://eth.llamarpc.com',
		true,
		'clgzp0u0h0000qw1234567890',
		datetime('now'),
		datetime('now')
	),
	(
		'clgzp0u0h1001qw1234567891',
		'https://ethereum.publicnode.com',
		true,
		'clgzp0u0h0000qw1234567890',
		datetime('now'),
		datetime('now')
	),
	-- Goerli
	(
		'clgzp0u0h1002qw1234567892',
		'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
		true,
		'clgzp0u0h0001qw1234567891',
		datetime('now'),
		datetime('now')
	),
	(
		'clgzp0u0h1003qw1234567893',
		'https://ethereum-goerli.publicnode.com',
		true,
		'clgzp0u0h0001qw1234567891',
		datetime('now'),
		datetime('now')
	),
	-- Sepolia
	(
		'clgzp0u0h1004qw1234567894',
		'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
		true,
		'clgzp0u0h0002qw1234567892',
		datetime('now'),
		datetime('now')
	),
	(
		'clgzp0u0h1005qw1234567895',
		'https://ethereum-sepolia.publicnode.com',
		true,
		'clgzp0u0h0002qw1234567892',
		datetime('now'),
		datetime('now')
	),
	-- BSC Mainnet
	(
		'clgzp0u0h1006qw1234567896',
		'https://bsc-dataseed.binance.org',
		true,
		'clgzp0u0h0003qw1234567893',
		datetime('now'),
		datetime('now')
	),
	(
		'clgzp0u0h1007qw1234567897',
		'https://bsc.publicnode.com',
		true,
		'clgzp0u0h0003qw1234567893',
		datetime('now'),
		datetime('now')
	),
	-- BSC Testnet
	(
		'clgzp0u0h1008qw1234567898',
		'https://data-seed-prebsc-1-s1.binance.org:8545',
		true,
		'clgzp0u0h0004qw1234567894',
		datetime('now'),
		datetime('now')
	),
	(
		'clgzp0u0h1009qw1234567899',
		'https://bsc-testnet.publicnode.com',
		true,
		'clgzp0u0h0004qw1234567894',
		datetime('now'),
		datetime('now')
	);