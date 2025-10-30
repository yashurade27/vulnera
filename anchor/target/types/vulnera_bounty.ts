/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/vulnera_bounty.json`.
 */
export type VulneraBounty = {
  "address": "5E6gim2SHCpuaJ4Lg3nq2nxs1So1t9MDU5ACdPdB1U6W",
  "metadata": {
    "name": "vulneraBounty",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "closeBounty",
      "docs": [
        "Closes the bounty and returns remaining funds to the owner."
      ],
      "discriminator": [
        90,
        33,
        205,
        110,
        210,
        22,
        247,
        49
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  111,
                  117,
                  110,
                  116,
                  121,
                  45,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "vault"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "bountyId",
          "type": "string"
        }
      ]
    },
    {
      "name": "deposit",
      "docs": [
        "Deposits additional funds into an existing bounty escrow."
      ],
      "discriminator": [
        242,
        35,
        198,
        137,
        82,
        225,
        242,
        182
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  111,
                  117,
                  110,
                  116,
                  121,
                  45,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "vault"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initialize",
      "docs": [
        "Initializes a new bounty escrow.",
        "Companies deposit funds into escrow for bounty payouts."
      ],
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  111,
                  117,
                  110,
                  116,
                  121,
                  45,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "escrowAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "processPayment",
      "docs": [
        "Processes payment for an approved submission.",
        "Pays the bounty hunter and deducts platform fee.",
        "Parameters like reward_per_submission, max_submissions, current_paid_submissions are provided by backend."
      ],
      "discriminator": [
        189,
        81,
        30,
        198,
        139,
        186,
        115,
        23
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  111,
                  117,
                  110,
                  116,
                  121,
                  45,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "vault"
          ]
        },
        {
          "name": "hunterWallet",
          "writable": true
        },
        {
          "name": "platformWallet",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "bountyId",
          "type": "string"
        },
        {
          "name": "submissionId",
          "type": "string"
        },
        {
          "name": "customAmount",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "rewardPerSubmission",
          "type": "u64"
        },
        {
          "name": "maxSubmissions",
          "type": "u32"
        },
        {
          "name": "currentPaidSubmissions",
          "type": "u32"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "bountyEscrow",
      "discriminator": [
        59,
        18,
        13,
        80,
        225,
        187,
        6,
        16
      ]
    }
  ],
  "events": [
    {
      "name": "bountyClosed",
      "discriminator": [
        93,
        75,
        96,
        53,
        212,
        127,
        82,
        120
      ]
    },
    {
      "name": "paymentProcessed",
      "discriminator": [
        22,
        109,
        191,
        213,
        83,
        63,
        120,
        219
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "insufficientFunds",
      "msg": "Insufficient funds in the vault."
    },
    {
      "code": 6001,
      "name": "overflow",
      "msg": "Arithmetic overflow occurred."
    },
    {
      "code": 6002,
      "name": "underflow",
      "msg": "Arithmetic underflow occurred."
    },
    {
      "code": 6003,
      "name": "invalidEscrowAmount",
      "msg": "Invalid escrow amount"
    },
    {
      "code": 6004,
      "name": "maxSubmissionsReached",
      "msg": "Maximum submissions reached"
    }
  ],
  "types": [
    {
      "name": "bountyClosed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bountyId",
            "type": "string"
          },
          {
            "name": "remainingAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "bountyEscrow",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "escrowAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "paymentProcessed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bountyId",
            "type": "string"
          },
          {
            "name": "submissionId",
            "type": "string"
          },
          {
            "name": "hunterWallet",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "platformFee",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
