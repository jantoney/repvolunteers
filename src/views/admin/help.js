(function () {
  const searchInput = document.getElementById("helpSearch");
  const tagList = document.getElementById("helpArticleList");
  const articles = Array.from(document.querySelectorAll("[data-help-article]"));
  const summary = document.getElementById("helpResultsSummary");
  const emptyState = document.getElementById("helpEmpty");
  let selectedTag = "";

  function normalise(value) {
    return value.trim().toLowerCase();
  }

  function articleMatches(article, query) {
    if (!query) {
      return true;
    }

    const name = article.dataset.helpName || "";
    const tags = article.dataset.helpTags || "";
    return name.includes(query) || tags.includes(query);
  }

  function articleHasSelectedTag(article) {
    if (!selectedTag) {
      return true;
    }

    const tags = (article.dataset.helpTags || "").split(" ");
    return tags.includes(selectedTag);
  }

  function updateTagButtons() {
    if (!tagList) {
      return;
    }

    tagList.querySelectorAll("[data-help-tag]").forEach((button) => {
      const isActive = button.dataset.helpTag === selectedTag;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function filterArticles() {
    const query = normalise(searchInput ? searchInput.value : "");
    let visibleCount = 0;

    articles.forEach((article) => {
      const visible = articleMatches(article, query) &&
        articleHasSelectedTag(article);
      article.hidden = !visible;
      if (visible) {
        visibleCount += 1;
      }
    });

    if (summary) {
      summary.textContent = visibleCount === 1
        ? "1 article"
        : visibleCount + " articles";
    }

    if (emptyState) {
      emptyState.classList.toggle("visible", visibleCount === 0);
    }

    updateTagButtons();
  }

  if (searchInput) {
    searchInput.addEventListener("input", filterArticles);
  }

  if (tagList) {
    tagList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-help-tag]");
      if (!button) {
        return;
      }

      selectedTag = selectedTag === button.dataset.helpTag
        ? ""
        : button.dataset.helpTag;
      filterArticles();
    });
  }

  filterArticles();
})();
