import React from "react";
import Pagination from "../components/Pagination";
import PasswordVisibilityButton from "../components/PasswordVisibilityButton";

import {
  cardStyle,
  inputStyle,
  tableStyle,
  thStyle,
  tdStyle,
  saveBtn,
  cancelBtn,
  printBtn,
  modalOverlay,
  modalBox,
} from "../styles/uiStyles";

function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="password-field">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ ...inputStyle, paddingRight: 54 }}
        autoComplete="new-password"
      />
      <PasswordVisibilityButton open={show} onClick={() => setShow((next) => !next)} />
    </div>
  );
}

export default function UsersPage(props) {
  const {
    newUsername, setNewUsername, newPassword, setNewPassword, newBranch, setNewBranch,
    newEmployeeName, setNewEmployeeName, newRole, setNewRole, addUser, users, setResetUserId,
    deleteUser, resetUserId, newResetPassword, setNewResetPassword, resetPassword, systemSettings,
  } = props;
  const [page, setPage] = React.useState(1);
  const [visiblePasswords, setVisiblePasswords] = React.useState({});
  const pageSize = Math.max(5, Number(systemSettings?.pageSize || 30));
  const rowHeight = Number(systemSettings?.rowHeight || 56);
  const tableWidth = Number(systemSettings?.tableWidth || 1180);
  const tableHeight = Number(systemSettings?.tableHeight || 620);
  const totalPages = Math.max(1, Math.ceil(users.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageUsers = users.slice((safePage - 1) * pageSize, safePage * pageSize);
  const userTableStyle = {
    ...tableStyle,
    minWidth: tableWidth,
    marginTop: 0,
  };
  const userCellStyle = {
    ...tdStyle,
    height: rowHeight,
  };

  return (
    <div style={cardStyle}>
      <div className="page-head">
        <div>
          <h2>จัดการผู้ใช้งาน</h2>
          <p>แสดง {pageUsers.length} จาก {users.length} รายการ</p>
        </div>      </div>

      <div className="user-form-grid">
        <input placeholder="Username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} style={inputStyle} />
        <PasswordInput placeholder="Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <input placeholder="ชื่อสาขา" value={newBranch} onChange={(e) => setNewBranch(e.target.value)} style={inputStyle} />
        <input placeholder="ชื่อพนักงาน" value={newEmployeeName} onChange={(e) => setNewEmployeeName(e.target.value)} style={inputStyle} />
        <select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={inputStyle}>
          <option value="Admin">Admin</option>
          <option value="Audit">Audit</option>
          <option value="Manager">Manager</option>
          <option value="Assistant Manager">Assistant Manager</option>
          <option value="Cashier">Cashier</option>
        </select>
        <button style={saveBtn} onClick={addUser}>เพิ่มผู้ใช้</button>
      </div>

      <div style={{ overflow: "auto", width: "100%", maxHeight: tableHeight, marginTop: 16 }}>
        <table style={userTableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Username</th>
              <th style={thStyle}>Password</th>
              <th style={thStyle}>พนักงาน</th>
              <th style={thStyle}>สาขา</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Reset</th>
              <th style={thStyle}>Delete</th>
            </tr>
          </thead>
          <tbody>
            {pageUsers.map((user, index) => (
              <tr key={user.id || index}>
                <td style={userCellStyle}>{user.username}</td>
                <td style={userCellStyle}>
                  <div className="table-password-cell">
                    <span>{visiblePasswords[user.id || index] ? user.password : "********"}</span>
                    <PasswordVisibilityButton
                      open={Boolean(visiblePasswords[user.id || index])}
                      onClick={() =>
                        setVisiblePasswords((prev) => ({
                          ...prev,
                          [user.id || index]: !prev[user.id || index],
                        }))
                      }
                    />
                  </div>
                </td>
                <td style={userCellStyle}>{user.employeeName}</td>
                <td style={userCellStyle}>{user.branch}</td>
                <td style={userCellStyle}>{user.role}</td>
                <td style={userCellStyle}><button style={printBtn} onClick={() => setResetUserId(user.id)}>Reset</button></td>
                <td style={userCellStyle}><button style={cancelBtn} onClick={() => deleteUser(user.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />

      {resetUserId && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h2>Reset Password</h2>
            <PasswordInput placeholder="New Password" value={newResetPassword} onChange={(e) => setNewResetPassword(e.target.value)} />
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button style={saveBtn} onClick={resetPassword}>Save</button>
              <button style={cancelBtn} onClick={() => { setResetUserId(null); setNewResetPassword(""); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
