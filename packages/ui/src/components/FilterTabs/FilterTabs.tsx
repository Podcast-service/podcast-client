import React, { useEffect, useRef, useState } from "react";
import styles from "./FilterTabs.module.css";
import ChevronSvg from "../../assets/icons/chevronDown.svg";
import LeftSvg from "../../assets/icons/left.svg";
import RightSvg from "../../assets/icons/right.svg";

interface Category {
  id: string;
  label: string;
}

interface SortOption {
  id: string;
  label: string;
}

interface FilterTabsProps {
  categories?: Category[];
  activeCategory?: string;
  onCategoryChange?: (id: string) => void;
  sortOptions?: SortOption[];
  activeSort?: string;
  onSortChange?: (id: string) => void;
}

const FilterTabs: React.FC<FilterTabsProps> = ({
  categories = [],
  activeCategory,
  onCategoryChange,
  sortOptions,
  activeSort,
  onSortChange,
}) => {
  const tabsRef = useRef<HTMLDivElement | null>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const hasCategories =
    categories.length > 0 && activeCategory && onCategoryChange;

  const hasSort = sortOptions && activeSort && onSortChange;

  const activeSortLabel = sortOptions?.find(
    (option) => option.id === activeSort
  )?.label;

  const updateScrollState = () => {
    const element = tabsRef.current;
    if (!element) return;

    const maxScrollLeft = element.scrollWidth - element.clientWidth;

    setCanScrollLeft(element.scrollLeft > 0);
    setCanScrollRight(element.scrollLeft < maxScrollLeft - 1);
  };

  const scrollTabs = (direction: "left" | "right") => {
    const element = tabsRef.current;
    if (!element) return;

    const scrollAmount = element.clientWidth * 0.7;

    element.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (!hasCategories) return;

    updateScrollState();

    const element = tabsRef.current;
    if (!element) return;

    element.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      element.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [categories, hasCategories]);

  return (
    <div className={`${styles.wrap} ${!hasCategories ? styles.wrapOnlySort : ""}`}>
      {hasCategories && (
        <div className={styles.tabsOuter}>
          <button
            type="button"
            className={`${styles.scrollBtn} ${
              !canScrollLeft ? styles.scrollBtnHidden : ""
            }`}
            onClick={() => scrollTabs("left")}
            aria-label="Прокрутить категории влево"
          >
            <img src={LeftSvg} alt="" aria-hidden="true" />
          </button>

          <div ref={tabsRef} className={styles.tabsWrap}>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`${styles.tab} ${
                  activeCategory === category.id ? styles.tabActive : ""
                }`}
                onClick={() => onCategoryChange(category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={`${styles.scrollBtn} ${
              !canScrollRight ? styles.scrollBtnHidden : ""
            }`}
            onClick={() => scrollTabs("right")}
            aria-label="Прокрутить категории вправо"
          >
            <img src={RightSvg} alt="" aria-hidden="true" />
          </button>
        </div>
      )}

      {hasSort && (
        <div className={styles.sortWrap}>
          <span className={styles.sortLabel}>Сортировка:</span>

          <div className={styles.customSelect}>
            <button
              type="button"
              className={styles.customSelectBtn}
              onClick={() => setIsSortOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={isSortOpen}
            >
              <span>{activeSortLabel}</span>

              <img
                src={ChevronSvg}
                alt=""
                aria-hidden="true"
                className={`${styles.chevron} ${
                  isSortOpen ? styles.chevronOpen : ""
                }`}
              />
            </button>

            {isSortOpen && (
              <div className={styles.dropdown} role="listbox">
                {sortOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`${styles.dropdownItem} ${
                      activeSort === option.id ? styles.dropdownItemActive : ""
                    }`}
                    onClick={() => {
                      onSortChange(option.id);
                      setIsSortOpen(false);
                    }}
                    role="option"
                    aria-selected={activeSort === option.id}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterTabs;