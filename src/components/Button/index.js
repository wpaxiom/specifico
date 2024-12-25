const Button = ({ className, children, ...rest }) => {
    return (
        <div className="specifico-content__btn">
            <button className={`specifico-button ${className}`} {...rest}>
                {children}
            </button>
        </div>
    );
}
export default Button;