export const RouterAbi = [
	{
		inputs: [
			{
				internalType: "address",
				name: "_factory",
				type: "address",
			},
			{
				internalType: "address",
				name: "_WETH",
				type: "address",
			},
			{
				internalType: "address",
				name: "_PYTH",
				type: "address",
			},
		],
		stateMutability: "nonpayable",
		type: "constructor",
	},
	{
		inputs: [],
		name: "PYTH",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "WETH",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "factory",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "amountOut",
				type: "uint256",
			},
			{
				internalType: "address[]",
				name: "path",
				type: "address[]",
			},
			{
				internalType: "bytes[]",
				name: "priceUpdate",
				type: "bytes[]",
			},
		],
		name: "getAmountsInWithPrice",
		outputs: [
			{
				internalType: "uint256[]",
				name: "amounts",
				type: "uint256[]",
			},
		],
		stateMutability: "payable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "amountIn",
				type: "uint256",
			},
			{
				internalType: "address[]",
				name: "path",
				type: "address[]",
			},
			{
				internalType: "bytes[]",
				name: "priceUpdate",
				type: "bytes[]",
			},
		],
		name: "getAmountsOutWithPrice",
		outputs: [
			{
				internalType: "uint256[]",
				name: "amounts",
				type: "uint256[]",
			},
		],
		stateMutability: "payable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "amountOut",
				type: "uint256",
			},
			{
				internalType: "address[]",
				name: "path",
				type: "address[]",
			},
			{
				internalType: "address",
				name: "to",
				type: "address",
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256",
			},
			{
				internalType: "bytes[]",
				name: "priceUpdate",
				type: "bytes[]",
			},
		],
		name: "swapETHForExactTokensWithPrice",
		outputs: [
			{
				internalType: "uint256[]",
				name: "amounts",
				type: "uint256[]",
			},
		],
		stateMutability: "payable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "amountOutMin",
				type: "uint256",
			},
			{
				internalType: "address[]",
				name: "path",
				type: "address[]",
			},
			{
				internalType: "address",
				name: "to",
				type: "address",
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256",
			},
			{
				internalType: "bytes[]",
				name: "priceUpdate",
				type: "bytes[]",
			},
		],
		name: "swapExactETHForTokensSupportingFeeOnTransferTokensWithPrice",
		outputs: [],
		stateMutability: "payable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "amountOutMin",
				type: "uint256",
			},
			{
				internalType: "address[]",
				name: "path",
				type: "address[]",
			},
			{
				internalType: "address",
				name: "to",
				type: "address",
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256",
			},
			{
				internalType: "bytes[]",
				name: "priceUpdate",
				type: "bytes[]",
			},
		],
		name: "swapExactETHForTokensWithPrice",
		outputs: [
			{
				internalType: "uint256[]",
				name: "amounts",
				type: "uint256[]",
			},
		],
		stateMutability: "payable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "amountIn",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "amountOutMin",
				type: "uint256",
			},
			{
				internalType: "address[]",
				name: "path",
				type: "address[]",
			},
			{
				internalType: "address",
				name: "to",
				type: "address",
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256",
			},
			{
				internalType: "bytes[]",
				name: "priceUpdate",
				type: "bytes[]",
			},
		],
		name: "swapExactTokensForETHSupportingFeeOnTransferTokensWithPrice",
		outputs: [],
		stateMutability: "payable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "amountIn",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "amountOutMin",
				type: "uint256",
			},
			{
				internalType: "address[]",
				name: "path",
				type: "address[]",
			},
			{
				internalType: "address",
				name: "to",
				type: "address",
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256",
			},
			{
				internalType: "bytes[]",
				name: "priceUpdate",
				type: "bytes[]",
			},
		],
		name: "swapExactTokensForETHWithPrice",
		outputs: [
			{
				internalType: "uint256[]",
				name: "amounts",
				type: "uint256[]",
			},
		],
		stateMutability: "payable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "amountIn",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "amountOutMin",
				type: "uint256",
			},
			{
				internalType: "address[]",
				name: "path",
				type: "address[]",
			},
			{
				internalType: "address",
				name: "to",
				type: "address",
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256",
			},
			{
				internalType: "bytes[]",
				name: "priceUpdate",
				type: "bytes[]",
			},
		],
		name: "swapExactTokensForTokensSupportingFeeOnTransferTokensWithPrice",
		outputs: [],
		stateMutability: "payable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "amountIn",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "amountOutMin",
				type: "uint256",
			},
			{
				internalType: "address[]",
				name: "path",
				type: "address[]",
			},
			{
				internalType: "address",
				name: "to",
				type: "address",
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256",
			},
			{
				internalType: "bytes[]",
				name: "priceUpdate",
				type: "bytes[]",
			},
		],
		name: "swapExactTokensForTokensWithPrice",
		outputs: [
			{
				internalType: "uint256[]",
				name: "amounts",
				type: "uint256[]",
			},
		],
		stateMutability: "payable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "amountOut",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "amountInMax",
				type: "uint256",
			},
			{
				internalType: "address[]",
				name: "path",
				type: "address[]",
			},
			{
				internalType: "address",
				name: "to",
				type: "address",
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256",
			},
			{
				internalType: "bytes[]",
				name: "priceUpdate",
				type: "bytes[]",
			},
		],
		name: "swapTokensForExactETHWithPrice",
		outputs: [
			{
				internalType: "uint256[]",
				name: "amounts",
				type: "uint256[]",
			},
		],
		stateMutability: "payable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "amountOut",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "amountInMax",
				type: "uint256",
			},
			{
				internalType: "address[]",
				name: "path",
				type: "address[]",
			},
			{
				internalType: "address",
				name: "to",
				type: "address",
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256",
			},
			{
				internalType: "bytes[]",
				name: "priceUpdate",
				type: "bytes[]",
			},
		],
		name: "swapTokensForExactTokensWithPrice",
		outputs: [
			{
				internalType: "uint256[]",
				name: "amounts",
				type: "uint256[]",
			},
		],
		stateMutability: "payable",
		type: "function",
	},
	{
		stateMutability: "payable",
		type: "receive",
	},
] as const;
