// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";



contract Library is ERC721URIStorage,Ownable{
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    Counters.Counter private _bookIds;
    address private own;
    constructor()ERC721("Book","BK"){
        own=msg.sender;
    }
    struct Book{
        uint tokenId;
        uint bookId;
        uint price;
    }
    mapping(uint=>uint) private bookIdCount;
    mapping(address=>Book[3]) private addressToBooks;
    mapping(uint=>Book[]) private bidToTokenArr;
    event MintBook(uint BookId);


    function mintNewBook(string memory tokenUri,uint price)public onlyOwner{
        _tokenIds.increment();
        _bookIds.increment();
        uint nid=_tokenIds.current();
        uint bid=_bookIds.current();
        bookIdCount[bid]++;
        bidToTokenArr[bid].push(Book(nid,bid,price));
        _mint(msg.sender, nid);
        _setTokenURI(nid, tokenUri);
        emit MintBook(bid);
    }

    function mintOldBook(uint _bookId)public onlyOwner{
        require(_bookId<=_bookIds.current(),"book not available");
        uint tid=bidToTokenArr[_bookId][0].tokenId;
        uint price=bidToTokenArr[_bookId][0].price;
        string memory tokenUri= tokenURI(tid);
        _tokenIds.increment();
        uint ntid=_tokenIds.current();
        bidToTokenArr[_bookId].push(Book(ntid,_bookId,price));
        bookIdCount[_bookId]++;
        _mint(msg.sender, ntid);
        _setTokenURI(ntid, tokenUri);
        emit MintBook(_bookId);
    }
    function noOfBooks(uint id)public view returns(uint){
        return bookIdCount[id]; 
    }
    function fetchBooks()public view returns(Book[] memory){
        uint totalBooks=_bookIds.current();
        uint count;
        for(uint i=1;i<=totalBooks;++i){
            if(bookIdCount[i]!=0){
            count++;
            }
        }
        Book[] memory books=new Book[](count);
        for(uint i=1;i<=totalBooks;i++){
            if(bookIdCount[i]!=0){
                books[count-1]=bidToTokenArr[i][0];
                count--;
            }
        }
        return books;
    }
    function ownedBooks()public view returns(Book[] memory){
        uint count=0;
        for(uint i=0;i<3;i++){
            if(addressToBooks[msg.sender][i].tokenId!=0)
            {
                count++;
            }
        }
        Book[] memory books=new Book[](count);
        for(uint i=0;i<3;i++){
            if(addressToBooks[msg.sender][i].tokenId!=0){
                books[count-1]=addressToBooks[msg.sender][i];
                count--;
            }
        }
        return books;
    }
    receive()external payable{}
    event BorrowBook(uint bookId,address borower);
    function borrowBooks(uint bookId)public payable returns(bool){
        require(msg.sender!=own);
        require(bookId<=_bookIds.current(),"bookid is not available");
        uint price=bidToTokenArr[bookId][0].price;
        require(msg.value==price,"send the currect price");
        require(bookIdCount[bookId]>0,"book is not available");
        uint len=bidToTokenArr[bookId].length;
       // uint price=bidToTokenArr[bookId][0].price;
        uint tokenId;
        for(uint i=0;i<len;i++){
            if(_ownerOf(bidToTokenArr[bookId][i].tokenId)==own){
                tokenId=bidToTokenArr[bookId][i].tokenId;
                break;
            }
        }
        for(uint i=0;i<3;i++){
            if(addressToBooks[msg.sender][i].bookId==bookId){
                revert("you can not borrow same book");
            }
            if(addressToBooks[msg.sender][i].bookId==0){
                addressToBooks[msg.sender][i]=Book(tokenId,bookId,price);
                break;
            }
            if(i==2){
                revert("you hav already borrowed 3 books");
            }
        }
        --bookIdCount[bookId];
        _transfer(own, msg.sender, tokenId);
        emit BorrowBook(bookId,msg.sender);
        return true;
    }
    function returnBook(uint bookId,uint tokenId)public {
        require(msg.sender!=own);
        require(bookId<=_bookIds.current());
        require(_ownerOf(tokenId)==msg.sender);
        uint len=bidToTokenArr[bookId].length;
        bool flag=false;
        for(uint i=0;i<len;i++){
            if(bidToTokenArr[bookId][i].tokenId==tokenId){
                flag=true;
                break;
            }
        }
        if(!flag){
            revert("book id and token id does not matched");
        }
        for(uint i=0;i<3;i++){
            if(addressToBooks[msg.sender][i].tokenId==tokenId){
                addressToBooks[msg.sender][i]=Book(0,0,0);
                break;
            }
        }
        ++bookIdCount[bookId];
        uint price=bidToTokenArr[bookId][0].price;
        _transfer(msg.sender, own, tokenId);
        payable(msg.sender).transfer(price);
    }
}