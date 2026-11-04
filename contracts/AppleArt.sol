// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @dev Minimal Chainlink price-feed interface (BNB/USD), same as G1999Presale.
interface IPriceFeed {
    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80);
}

/// @title AppleArt — 3,333-piece origami apple NFT collection on BNB Chain.
/// @notice Public mint price is $0.10, paid in BNB at the live Chainlink
///         BNB/USD rate. 100% of every mint payment is forwarded in the same
///         transaction to the immutable treasury wallet; this contract never
///         holds funds (it has no receive/fallback and no withdrawal path).
///         Project commitment: all proceeds are used later for the future
///         token's liquidity.
/// @dev 33 Legendary token ids are team-reserved on-chain: the public mint
///      pointer skips them, and only the owner can mint them, only to a
///      chosen team address. Token ids are 1..3333 and each id's tier is
///      fixed by the published metadata (IPFS).
contract AppleArt is ERC721, Ownable, ReentrancyGuard {
    using Strings for uint256;

    /// @notice Total collection size (token ids 1..3333).
    uint256 public constant MAX_SUPPLY = 3333;
    /// @notice Maximum number of team-reserved token ids.
    uint256 public constant MAX_RESERVED = 33;
    /// @notice Public mint price in USD with 8 decimals ($0.10).
    uint256 public constant PRICE_USD8 = 10_000_000;
    /// @notice Treasury wallet: receives 100% of mint proceeds, in the same
    ///         transaction as the mint. Hardcoded and immutable.
    address public constant TREASURY = 0x36aB2cB68475CfDb4B7da0c33e20b4C1a1837486;
    /// @notice Max NFTs per public mint transaction.
    uint256 public constant MAX_PER_TX = 50;

    /// @notice Chainlink BNB/USD feed (BSC mainnet), set at construction.
    IPriceFeed public immutable bnbUsdFeed;

    string private _baseURIString;
    bool public saleActive;
    uint256 public nextId = 1;
    uint256 public publicMinted;
    uint256 public reserveMinted;
    uint256 public reservedCount;
    mapping(uint256 => bool) public isReserved;

    event PublicMint(address indexed buyer, uint256 quantity, uint256 paidWei);
    event ReservedSet(uint256[] ids);
    event ReserveMint(address indexed to, uint256[] ids);
    event SaleActiveSet(bool active);
    event BaseURISet(string baseURI);

    constructor(address feed, string memory baseURI_) ERC721("Apple Art", "APPL") Ownable(msg.sender) {
        require(feed != address(0), "feed=0");
        bnbUsdFeed = IPriceFeed(feed);
        _baseURIString = baseURI_;
    }

    // ------------------------------------------------------------ pricing

    /// @notice Current BNB/USD answer (8 decimals), reverts on a bad oracle.
    function bnbUsd() public view returns (uint256) {
        (, int256 answer,,,) = bnbUsdFeed.latestRoundData();
        require(answer > 0, "bad oracle");
        return uint256(answer);
    }

    /// @notice Current public mint price in wei ($0.10 at the live rate).
    function priceWei() public view returns (uint256) {
        return (PRICE_USD8 * 1e18) / bnbUsd();
    }

    /// @notice NFTs minted so far (public + reserve).
    function totalMinted() public view returns (uint256) {
        return publicMinted + reserveMinted;
    }

    /// @notice Public NFTs still available.
    function publicRemaining() public view returns (uint256) {
        return MAX_SUPPLY - reservedCount - publicMinted;
    }

    // ------------------------------------------------------------ public mint

    /// @notice Mint `quantity` NFTs at $0.10 each. The full charge is
    ///         forwarded to the treasury in this same transaction; any
    ///         overpayment is refunded to the buyer in this same
    ///         transaction. If the forward fails, the mint reverts.
    function mint(uint256 quantity) external payable nonReentrant {
        require(saleActive, "sale closed");
        require(quantity > 0 && quantity <= MAX_PER_TX, "bad quantity");
        require(publicMinted + quantity <= MAX_SUPPLY - reservedCount, "sold out");

        uint256 cost = priceWei() * quantity;
        require(msg.value >= cost, "underpaid");

        (bool ok,) = TREASURY.call{value: cost}("");
        require(ok, "treasury forward failed");
        uint256 refund = msg.value - cost;
        if (refund > 0) {
            (bool okRefund,) = msg.sender.call{value: refund}("");
            require(okRefund, "refund failed");
        }

        for (uint256 i = 0; i < quantity; i++) {
            uint256 id = _nextPublicId();
            publicMinted++;
            _safeMint(msg.sender, id);
        }
        emit PublicMint(msg.sender, quantity, cost);
    }

    /// @dev Advance the pointer past reserved and already-minted ids.
    function _nextPublicId() internal returns (uint256) {
        uint256 id = nextId;
        while (id <= MAX_SUPPLY && (isReserved[id] || _ownerOf(id) != address(0))) {
            id++;
        }
        require(id <= MAX_SUPPLY, "sold out");
        nextId = id + 1;
        return id;
    }

    // ------------------------------------------------------------ owner ops

    /// @notice Mark token ids as team-reserved. Reserved ids can never be
    ///         reached by the public mint. At most MAX_RESERVED ids total.
    function setReserved(uint256[] calldata ids) external onlyOwner {
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            require(id >= 1 && id <= MAX_SUPPLY, "id out of range");
            require(!isReserved[id], "already reserved");
            require(_ownerOf(id) == address(0), "already minted");
            require(reservedCount < MAX_RESERVED, "reserve full");
            isReserved[id] = true;
            reservedCount++;
        }
        emit ReservedSet(ids);
    }

    /// @notice Mint reserved ids to the team wallet. Only the owner, only
    ///         ids previously marked reserved, each id once.
    function mintReserved(address to, uint256[] calldata ids) external onlyOwner {
        require(to != address(0), "to=0");
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            require(isReserved[id], "not reserved");
            require(_ownerOf(id) == address(0), "already minted");
            reserveMinted++;
            _safeMint(to, id);
        }
        emit ReserveMint(to, ids);
    }

    function setSaleActive(bool v) external onlyOwner {
        saleActive = v;
        emit SaleActiveSet(v);
    }

    function setBaseURI(string calldata baseURI_) external onlyOwner {
        _baseURIString = baseURI_;
        emit BaseURISet(baseURI_);
    }

    // ------------------------------------------------------------ metadata

    function _baseURI() internal view override returns (string memory) {
        return _baseURIString;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string(abi.encodePacked(_baseURI(), tokenId.toString(), ".json"));
    }
}
