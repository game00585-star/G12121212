import React from "react";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 30;

export default function Price({
  products,
  search,
  setSearch,
  importExcel,
  cardStyle,
  inputStyle,
  tableStyle,
  thStyle,
  tdStyle,
}) {
  const [page, setPage] = React.useState(1);
  const keyword = String(search || "").toLowerCase().trim();
  const filteredProducts = React.useMemo(() => {
    return products.filter((item) => {
      if (!keyword) return true;

      return (
        String(item.name || "").toLowerCase().includes(keyword) ||
        String(item.barcode || "").toLowerCase().includes(keyword)
      );
    });
  }, [products, keyword]);
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageProducts = filteredProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  React.useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div style={cardStyle}>
      <div className="page-head">
        <div>
          <h2>สินค้า</h2>
          <p>แสดง {pageProducts.length} จาก {filteredProducts.length} รายการ</p>
        </div>
        <label className="file-import-button">
          เลือกไฟล์สินค้า
          <input type="file" multiple onChange={importExcel} />
        </label>
      </div>

      <input
        placeholder="ค้นหาสินค้า / barcode"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={inputStyle}
      />

      <div style={{ overflowX: "auto", width: "100%" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Barcode</th>
              <th style={thStyle}>สินค้า</th>
              <th style={thStyle}>หน่วย</th>
              <th style={thStyle}>หมวด</th>
              <th style={thStyle}>หมวดสินค้า</th>
            </tr>
          </thead>
          <tbody>
            {pageProducts.map((item, index) => (
              <tr key={item.id || item.barcode || index}>
                <td style={tdStyle}>{item.barcode}</td>
                <td style={tdStyle}>{item.name}</td>
                <td style={tdStyle}>{item.unit}</td>
                <td style={tdStyle}>{item.category}</td>
                <td style={tdStyle}>{item.categoryType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
