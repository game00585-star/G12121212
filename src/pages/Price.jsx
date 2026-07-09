import React from "react";
import Pagination from "../components/Pagination";

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
  systemSettings,
}) {
  const [page, setPage] = React.useState(1);
  const keyword = String(search || "").toLowerCase().trim();
  const pageSize = Math.max(5, Number(systemSettings?.pageSize || 30));
  const rowHeight = Number(systemSettings?.rowHeight || 56);
  const tableWidth = Number(systemSettings?.tableWidth || 1180);
  const tableHeight = Number(systemSettings?.tableHeight || 620);
  const filteredProducts = React.useMemo(() => {
    return products.filter((item) => {
      if (!keyword) return true;

      return (
        String(item.name || "").toLowerCase().includes(keyword) ||
        String(item.barcode || "").toLowerCase().includes(keyword)
      );
    });
  }, [products, keyword]);
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageProducts = filteredProducts.slice((safePage - 1) * pageSize, safePage * pageSize);

  React.useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  const tableSizeStyle = {
    ...tableStyle,
    minWidth: tableWidth,
    marginTop: 0,
  };
  const cellStyle = {
    ...tdStyle,
    height: rowHeight,
  };

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

      <div style={{ overflow: "auto", width: "100%", maxHeight: tableHeight, marginTop: 16 }}>
        <table style={tableSizeStyle}>
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
                <td style={cellStyle}>{item.barcode}</td>
                <td style={cellStyle}>{item.name}</td>
                <td style={cellStyle}>{item.unit}</td>
                <td style={cellStyle}>{item.category}</td>
                <td style={cellStyle}>{item.categoryType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
