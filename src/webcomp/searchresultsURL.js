import React, { useState, useEffect } from "react"
import Axios from 'axios'
import './searchresults.css'
import { useSearchParams } from "react-router-dom";
import { Checkbox } from "@material-ui/core";


export default function SearchResults() {
    const [searchParems, setSearchParems] = useSearchParams();
    const [searchResults, setSearchResults] = useState([])
    const [storeSolaris, setSolarisNums] = useState()
    const [storeTOM, setTOMNums] = useState()
    const [currentPage, setCurrentPage] = useState(1)
    var pages = getPages()

    function getItems(p) {
        Axios.get('https://figurecenter.herokuapp.com/numInStore', {
            params: {
                name: "SolarisJapan",
                searchParem: p
            }
        }).then((response) => {
            setSolarisNums(response.data[0].count.toString())
        })
        Axios.get('https://figurecenter.herokuapp.com/numInStore', {
            params: {
                name: "TokyoOtakuMode",
                searchParem: p
            }
        }).then((response) => {
            setTOMNums(response.data[0].count.toString())
        })
    }
    function getData(p, filters, sortPrice, ordertype) {
        Axios.get('https://figurecenter.herokuapp.com/search', {
            params: {
                searchParem: p,
                filters: filters,
                sort$: sortPrice,
                ordertype: ordertype
            }
        }).then((response) => {
            setSearchResults(response.data)
        })
    }

    function getPages() {
        const pages2 = []
        const remainder = searchResults.length % 24
        for (var i = 0; i < Math.floor(searchResults.length / 24); i++) {
            const temp = searchResults.slice(i * 24, ((i + 1) * 24))
            pages2.push(temp)
        }
        pages2.push(searchResults.slice(searchResults.length - remainder, searchResults.length))
        return pages2
    }
    //get initial pages
    useEffect(() => {
        getData(searchParems.get('query'), searchParems.get('filters'), searchParems.get('sort$'), searchParems.get('ordertype'))
        setCurrentPage(1)
        pages = getPages()
    }, [searchParems.get('query'), searchParems.get('filters'), searchParems.get('sort$'), searchParems.get('ordertype')])
    useEffect(() => {
        getItems(searchParems.get('query'))
    }, [searchParems.get('query')])

    function nextPage() {
        setCurrentPage(currentPage + 1)
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }
    function prevPage() {
        setCurrentPage(currentPage - 1)
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }
    function toPage(num) {
        setCurrentPage(num)
    }
    function displayPagesBar() {
        const numPages = pages.length
        if (pages[0].length === 0) {
            return (
                <div>

                </div>)
        }
        else if (numPages === 1) {
            return (
                <div className="pagesBar">
                    <div className="currentPage">
                        {currentPage}
                    </div>
                </div>
            )
        }
        else if (numPages === 2) {
            if (currentPage === 1) {
                return (
                    <div className="pagesBar">
                        <div className="currentPage">
                            {currentPage}
                        </div>
                        <div>
                            <button className="nextPage" onClick={() => toPage(currentPage + 1)}> {currentPage + 1} </button>
                        </div>
                        <button className="switchPage" onClick={() => nextPage()}> Next </button>
                    </div>
                )
            }
            else {
                return (
                    <div className="pagesBar">
                        <button className="switchPage" onClick={() => prevPage()}> Previous </button>
                        <div>
                            <button className="prevPage" onClick={() => toPage(currentPage - 1)}> {currentPage - 1} </button>
                        </div>
                        <div className="currentPage">
                            {currentPage}
                        </div>
                    </div>
                )
            }
        }
        else if (numPages === 3) {
            if (currentPage === 1) {
                return (
                    <div className="pagesBar">
                        <div className="currentPage">
                            {currentPage}
                        </div>
                        <div>
                            <button className="nextPage" onClick={() => toPage(currentPage + 1)}> {currentPage + 1} </button>
                        </div>
                        <div>
                            <button className="nextPage" onClick={() => toPage(currentPage + 2)}> {currentPage + 2} </button>
                        </div>
                        <button className="switchPage" onClick={() => nextPage()}> Next </button>
                    </div>
                )
            }
            else if (currentPage === 2) {
                return (
                    <div className="pagesBar">
                        <button className="switchPage" onClick={() => prevPage()}> Previous </button>
                        <div>
                            <button className="prevPage" onClick={() => toPage(currentPage - 1)}> {currentPage - 1} </button>
                        </div>
                        <div className="currentPage">
                            {currentPage}
                        </div>
                        <div>
                            <button className="nextPage" onClick={() => toPage(currentPage + 1)}> {currentPage + 1} </button>
                        </div>
                        <button className="switchPage" onClick={() => nextPage()}> Next </button>
                    </div>
                )
            }
            else {
                return (
                    <div className="pagesBar">
                        <button className="switchPage" onClick={() => prevPage()}> Previous </button>
                        <div>
                            <button className="prevPage" onClick={() => toPage(currentPage - 2)}> {currentPage - 2} </button>
                        </div>
                        <div>
                            <button className="prevPage" onClick={() => toPage(currentPage - 1)}> {currentPage - 1} </button>
                        </div>
                        <div className="currentPage">
                            {currentPage}
                        </div>
                    </div>
                )
            }
        }
        else if (numPages === 4) {
            if (currentPage === 1) {
                return (
                    <div className="pagesBar">
                        <div className="currentPage">
                            {currentPage}
                        </div>
                        <div>
                            <button className="nextPage" onClick={() => toPage(currentPage + 1)}> {currentPage + 1} </button>
                        </div>
                        <div className="toEndPage">
                            ...
                        </div>
                        <div>
                            <button className="lastPage" onClick={() => toPage(numPages)}> {numPages} </button>
                        </div>
                        <button className="switchPage" onClick={() => nextPage()}> Next </button>
                    </div>
                )
            }
            else if (currentPage === 2) {
                return (
                    <div className="pagesBar">
                        <button className="switchPage" onClick={() => prevPage()}> Previous </button>
                        <div>
                            <button className="prevPage" onClick={() => toPage(currentPage - 1)}> {currentPage - 1} </button>
                        </div>
                        <div className="currentPage">
                            {currentPage}
                        </div>
                        <div>
                            <button className="nextPage" onClick={() => toPage(currentPage + 1)}> {currentPage + 1} </button>
                        </div>
                        <div>
                            <button className="lastPage" onClick={() => toPage(numPages)}> {numPages} </button>
                        </div>
                        <button className="switchPage" onClick={() => nextPage()}> Next </button>
                    </div>
                )
            }
            else if (currentPage === 3) {
                return (
                    <div className="pagesBar">
                        <button className="switchPage" onClick={() => prevPage()}> Previous </button>
                        <div>
                            <button className="prevPage" onClick={() => toPage(currentPage - 2)}> {currentPage - 2} </button>
                        </div>
                        <div>
                            <button className="prevPage" onClick={() => toPage(currentPage - 1)}> {currentPage - 1} </button>
                        </div>
                        <div className="currentPage">
                            {currentPage}
                        </div>
                        <div>
                            <button className="lastPage" onClick={() => toPage(numPages)}> {numPages} </button>
                        </div>
                        <button className="switchPage" onClick={() => nextPage()}> Next </button>
                    </div>
                )
            }
            else {
                return (
                    <div className="pagesBar">
                        <button className="switchPage" onClick={() => prevPage()}> Previous </button>
                        <div>
                            <button className="prevPage" onClick={() => toPage(currentPage - 3)}> {currentPage - 3} </button>
                        </div>
                        <div className="toEndPage">
                            ...
                        </div>
                        <div>
                            <button className="prevPage" onClick={() => toPage(currentPage - 1)}> {currentPage - 1} </button>
                        </div>
                        <div className="currentPage">
                            {currentPage}
                        </div>
                    </div>
                )
            }
        }
        else {
            if (currentPage === 1) {
                return (
                    <div className="pagesBar">
                        <div className="currentPage">
                            {currentPage}
                        </div>
                        <div>
                            <button className="nextPage" onClick={() => toPage(currentPage + 1)}> {currentPage + 1} </button>
                        </div>
                        <div className="toEndPage">
                            ...
                        </div>
                        <div>
                            <button className="lastPage" onClick={() => toPage(numPages)}> {numPages} </button>
                        </div>
                        <button className="switchPage" onClick={() => nextPage()}> Next </button>
                    </div>
                )
            }
            else if (currentPage > 1 && currentPage < numPages - 1) {
                return (
                    <div className="pagesBar">
                        <button className="switchPage" onClick={() => prevPage()}> Previous </button>
                        <div>
                            <button className="prevPage" onClick={() => toPage(currentPage - 1)}> {currentPage - 1} </button>
                        </div>
                        <div className="currentPage">
                            {currentPage}
                        </div>
                        <div>
                            <button className="nextPage" onClick={() => toPage(currentPage + 1)}> {currentPage + 1} </button>
                        </div>
                        <div className="toEndPage">
                            ...
                        </div>
                        <div>
                            <button className="lastPage" onClick={() => toPage(numPages)}> {numPages} </button>
                        </div>
                        <button className="switchPage" onClick={() => nextPage()}> Next </button>
                    </div>
                )
            }
            else if (currentPage > 1 && currentPage < numPages) {
                return (
                    <div className="pagesBar">
                        <button className="switchPage" onClick={() => prevPage()}> Previous </button>
                        <div>
                            <button className="prevPage" onClick={() => toPage(1)}> {1} </button>
                        </div>
                        <div className="toEndPage">
                            ...
                        </div>
                        <div>
                            <button className="prevPage" onClick={() => toPage(currentPage - 1)}> {currentPage - 1} </button>
                        </div>
                        <div className="currentPage">
                            {currentPage}
                        </div>
                        <div >
                            <button className="nextPage" onClick={() => toPage(currentPage + 1)}> {currentPage + 1} </button>
                        </div>
                        <button className="switchPage" onClick={() => nextPage()}> Next </button>
                    </div>
                )
            }
            else {
                return (
                    <div className="pagesBar">
                        <button className="switchPage" onClick={() => prevPage()}> Previous </button>
                        <div>
                            <button className="prevPage" onClick={() => toPage(1)}> {1} </button>
                        </div>
                        <div className="toEndPage">
                            ...
                        </div>
                        <div>
                            <button className="prevPage" onClick={() => toPage(currentPage - 1)}> {currentPage - 1} </button>
                        </div>
                        <div className="currentPage">
                            {currentPage}
                        </div>
                    </div>
                )
            }

        }
    }
    function queryCheck(q) {
        if (q != "") {
            return 'Results for "' + q + '"'
        }
        return null
    }

    function buyable(price, preowned, rel, website) {
        if (website === "SolarisJapan") {
            if (rel === "") {
                if (price && preowned != "") {
                    return (<div>
                        <div className="priceNew"> {"Brand New: $" + price} </div>
                        <div className="pricePreOwned"> {"Pre-Owned: $" + preowned} </div>
                    </div>)
                }
                else if (price != "") {
                    return (<div className="priceNew"> {"Brand New: $" + price} </div>)
                }
                else if (preowned != "") {
                    return (<div className="pricePreOwned"> {"Pre-Owned: $" + preowned} </div>)
                }
                else {
                    return <div className="soldOut"> Sold Out </div>
                }
            }

            else if (rel != "" && price != "") {
                return (<div>
                    <div className="priceNew"> {"Pre-Order: $" + price} </div>
                    <div className="priceRelease"> {"Release: " + rel} </div>
                </div>)
            }
            else if (price === "") {
                return (<div className="priceRelease"> {"Release: " + rel} </div>)
            }
            return <div className="soldOut"> Sold Out </div>
        }
        else if (website === "TokyoOtakuMode") {
            if (rel === "") {
                return (<div className="priceNew"> {"Brand New: $" + price} </div>)
            }
            else {
                return (<div>
                    <div className="priceNew"> {"Pre-Order: $" + price} </div>
                    <div className="priceRelease"> {"Release: " + rel} </div>
                </div>)
            }
        }
    }
    function handleStoreFitler(name) {
        switch (name) {
            case 'SolarisJapanCheck':
                if (searchParems.get('filters').charAt(0) === '0') {
                    let tempStr = '1'
                    for (let i = 1; i < searchParems.get('filters').length; i++) {
                        tempStr += searchParems.get('filters').toString().charAt(i)
                    }
                    setSearchParems({ query: searchParems.get('query'), filters: tempStr, sort$: searchParems.get('sort$'), ordertype: searchParems.get('ordertype') })
                }
                else {
                    let tempStr = '0'
                    for (let i = 1; i < searchParems.get('filters').length; i++) {
                        tempStr += searchParems.get('filters').toString().charAt(i)
                    }
                    setSearchParems({ query: searchParems.get('query'), filters: tempStr, sort$: searchParems.get('sort$'), ordertype: searchParems.get('ordertype') })
                }
                break

            case 'TokyoOtakuModeCheck':
                if (searchParems.get('filters').charAt(1) === '0') {
                    let tempStr = searchParems.get('filters').charAt(0) + '1'
                    for (let i = 2; i < searchParems.get('filters').length; i++) {
                        tempStr += searchParems.get('filters').charAt(i)
                    }
                    setSearchParems({ query: searchParems.get('query'), filters: tempStr, sort$: searchParems.get('sort$'), ordertype: searchParems.get('ordertype') })
                }
                else {
                    let tempStr = searchParems.get('filters').charAt(0) + '0'
                    for (let i = 2; i < searchParems.get('filters').length; i++) {
                        tempStr += searchParems.get('filters').charAt(i)
                    }
                    setSearchParems({ query: searchParems.get('query'), filters: tempStr, sort$: searchParems.get('sort$'), ordertype: searchParems.get('ordertype') })

                }
                break
        }
    }

    function handlePriceFilter(type) {
        setSearchParems({ query: searchParems.get('query'), filters: searchParems.get('filters'), sort$: type })
        const menu = document.getElementById("priceMenuHeader")
        switch (type) {
            case "":
                menu.innerHTML = "None"
                break
            case "low":
                menu.innerHTML = "Low-To-High"
                break
            case "high":
                menu.innerHTML = "High-To-Low"
                break
        }
    }
    function collapseMenu(id) {
        const menu = document.getElementById(id)
        if (menu.style.opacity === "1") {
            menu.style.opacity = "0"
            menu.style.height = "0px"
        }
        else {
            menu.style.opacity = "1"
            menu.style.height = "auto"
        }
    }

    function orderTypeFilter(type) {
        var tempOrder = "000"
        if (searchParems.get("ordertype") != null) {
            tempOrder = searchParems.get("ordertype")
        }
        switch (type) {
            case "preorder":
                if (tempOrder.charAt(0) === "0") {
                    tempOrder = "1" + tempOrder.slice(1)
                }
                else {
                    tempOrder = "0" + tempOrder.slice(1)
                }
                break
            case "brandnew":
                if (tempOrder.charAt(1) === "0") {
                    tempOrder = tempOrder.charAt(0) + "1" + tempOrder.charAt(2)
                }
                else {
                    tempOrder = tempOrder.charAt(0) + "0" + tempOrder.charAt(2)
                }
                break
            case "remsoldout":
                if (tempOrder.charAt(2) === "0") {
                    tempOrder = tempOrder.slice(0, 2) + "1"
                }
                else {
                    tempOrder = tempOrder.slice(0, 2) + "0"
                }
                break
        }
        setSearchParems({ query: searchParems.get('query'), filters: searchParems.get('filters'), sort$: searchParems.get('sort$'), ordertype: tempOrder })
    }

    return (
        <>
            <div className="searchContainer">
                <div className="filterContainer">
                    <div className="filterElement">
                        <div className="filterTitle"> Select Store </div>
                        <div className="filterItem">
                            <Checkbox style={{ color: "red" }} id='SolarisJapanCheck' onChange={e => handleStoreFitler('SolarisJapanCheck')} />
                            {'Solaris Japan (' + storeSolaris + ')'}
                        </div>
                        <div className="filterItem">
                            <Checkbox style={{ color: "red" }} id='TokyoOtakuModeCheck' onChange={e => handleStoreFitler('TokyoOtakuModeCheck')} />
                            {'Tokyo Otaku Mode (' + storeTOM + ')'}
                        </div>
                    </div>
                    <div className="filterElement">
                        <div className="filterTitle"> Sort by Price</div>
                        <div className="colMenu" onClick={() => collapseMenu('priceMenu')}>
                            <div id="priceMenuHeader" className="colMenuTitle"> None </div>
                            <div id="priceMenu" className="colMenuItems">
                                <div className="menuItem" onClick={() => handlePriceFilter("")}> None </div>
                                <div className="menuItem" onClick={() => handlePriceFilter("low")}> Low-To-High </div>
                                <div className="menuItem" onClick={() => handlePriceFilter("high")}> High-To-Low </div>
                            </div>
                        </div>
                    </div>
                    <div className="filterElement">
                        <div className="filterTitle"> Item Type </div>
                        <div className="filterItem">
                            <Checkbox style={{ color: "red" }} id='SolarisJapanCheck' onChange={e => orderTypeFilter('preorder')} />
                            {"Pre-order"}
                        </div>
                        <div className="filterItem">
                            <Checkbox style={{ color: "red" }} id='TokyoOtakuModeCheck' onChange={e => orderTypeFilter('brandnew')} />
                            {"Brand-New"}
                        </div>
                        <div className="filterItem">
                            <Checkbox style={{ color: "red" }} id='TokyoOtakuModeCheck' onChange={e => orderTypeFilter('remsoldout')} />
                            {"Remove Sold-Out"}


                        </div>
                    </div>
                </div>

                <div className="alignment">
                    <div className="resultsFor"> {queryCheck(searchParems.get('query'))} </div>
                    <hr className="searchLine" />
                    <div className="innerAlignment">
                        {pages[currentPage - 1].map(product =>
                            <div className="productContainer">
                                <a style={{ marginBottom: "5px" }} href={product.url} target="_blank"><img className="productImage" src={product.image} /></a>
                                <div className="productInformation">
                                    <div className="title"> {product.name} </div>
                                    <div> {buyable(product.price, product.preowned, product.rel, product.website)} </div>
                                    <div> {product.website} </div>
                                </div>
                            </div>)}
                    </div>
                    {displayPagesBar()}
                </div>

            </div>
        </>
    )

}


//LOAD IN PAGES