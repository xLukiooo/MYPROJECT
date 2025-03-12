import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Aktualizujemy stan, aby kolejne renderowanie pokazało UI błędu
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Możesz tu wysłać logi błędów do zewnętrznego serwisu, jeśli chcesz
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h2>Coś poszło nie tak. Spróbuj ponownie później.</h2>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
