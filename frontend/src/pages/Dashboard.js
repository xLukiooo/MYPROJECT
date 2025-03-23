import React, { useState, useEffect } from 'react';
import { getExpenses, createExpense } from '../api/expenses';
import { getExpenseSummary } from '../api/summary';
import { logout } from '../api/auth';
import { useNavigate } from 'react-router-dom';

/**
 * Komponent Dashboard
 *
 * Wyświetla listę wydatków zalogowanego użytkownika, pogrupowanych według daty.
 * Umożliwia dodawanie nowych wydatków oraz wyświetla podsumowanie wydatków od początku miesiąca.
 * Na górze po prawej stronie znajduje się przycisk wylogowania.
 */
function Dashboard() {
  const [groupedExpenses, setGroupedExpenses] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expenseFormVisible, setExpenseFormVisible] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: '', amount: '', date: '' });
  const navigate = useNavigate();

  const fetchExpenses = async () => {
    try {
      const data = await getExpenses();
      setGroupedExpenses(data);
    } catch (err) {
      setError('Błąd pobierania wydatków');
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await getExpenseSummary();
      setSummary(data);
    } catch (err) {
      console.error('Błąd pobierania podsumowania wydatków', err);
    }
  };

  useEffect(() => {
    async function fetchData() {
      await Promise.all([fetchExpenses(), fetchSummary()]);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      setError('Błąd podczas wylogowywania');
    }
  };

  const toggleExpenseForm = () => {
    setExpenseFormVisible(!expenseFormVisible);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewExpense(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await createExpense(newExpense);
      setNewExpense({ category: '', amount: '', date: '' });
      setExpenseFormVisible(false);
      fetchExpenses();
      fetchSummary();
    } catch (err) {
      setError(err.message || 'Błąd przy dodawaniu wydatku');
    }
  };

  if (loading) {
    return <div>Ładowanie...</div>;
  }

  return (
    <div style={{ padding: '20px', position: 'relative', display: 'flex', gap: '20px' }}>
      <button onClick={handleLogout} style={{ position: 'absolute', top: '20px', right: '20px' }}>
        Wyloguj
      </button>
      <div style={{ flex: 2 }}>
        <h2>Wydatki</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button onClick={toggleExpenseForm}>
          {expenseFormVisible ? 'Anuluj dodawanie wydatku' : 'Dodaj wydatek'}
        </button>
        {expenseFormVisible && (
          <form onSubmit={handleCreateExpense} style={{ margin: '10px 0' }}>
            <div>
              <label>Kategoria:</label>
              <input type="text" name="category" value={newExpense.category} onChange={handleInputChange} required />
            </div>
            <div>
              <label>Kwota:</label>
              <input type="number" name="amount" value={newExpense.amount} onChange={handleInputChange} required />
            </div>
            <div>
              <label>Data:</label>
              <input type="date" name="date" value={newExpense.date} onChange={handleInputChange} required />
            </div>
            <button type="submit">Dodaj wydatek</button>
          </form>
        )}
        {groupedExpenses.length === 0 ? (
          <p>Brak wydatków.</p>
        ) : (
          groupedExpenses.map(group => (
            <div key={group.date} style={{ marginBottom: '20px' }}>
              <h3>{group.date}</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {group.expenses.map(expense => (
                  <li key={expense.id} style={{ padding: '5px 0', borderBottom: '1px solid #ccc' }}>
                    {expense.category} - {expense.amount} zł
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
      <div style={{ flex: 1, borderLeft: '1px solid #ccc', paddingLeft: '20px' }}>
        <h2>Podsumowanie wydatków od początku miesiąca</h2>
        {summary.length === 0 ? (
          <p>Brak wydatków.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {summary.map((item, index) => (
              <li key={index} style={{ padding: '5px 0', borderBottom: '1px solid #ccc' }}>
                <strong>{item.category}:</strong> {item.total} zł
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
