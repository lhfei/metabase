(ns metabase-enterprise.metabot-v3.tools.util
  (:require
   [clojure.string :as str]
   [medley.core :as m]
   [metabase.api.common :as api]
   [metabase.collections.models.collection :as collection]
   [metabase.lib-be.metadata.jvm :as lib.metadata.jvm]
   [metabase.lib.core :as lib]
   [metabase.lib.metadata :as lib.metadata]
   [metabase.lib.types.isa :as lib.types.isa]
   [metabase.util :as u]
   [toucan2.core :as t2]))

(defn handle-agent-error
  "Return an agent output for agent errors, re-throw `e` otherwise."
  [e]
  (if (-> e ex-data :agent-error?)
    {:output (ex-message e)}
    (throw e)))

(defn convert-field-type
  "Return tool type for `column`."
  [column]
  (let [column (u/normalize-map column)]
    (cond
      (lib.types.isa/boolean? column)                :boolean
      (lib.types.isa/string-or-string-like? column)  :string
      (lib.types.isa/numeric? column)                :number
      (isa? (:effective-type column) :type/DateTime) :datetime
      (isa? (:effective-type column) :type/Time)     :time
      (lib.types.isa/temporal? column)               :date)))

(defn table-field-id-prefix
  "Return the field ID prefix for `table-id`."
  [table-id]
  (str "t" table-id "/"))

(defn card-field-id-prefix
  "Return the field ID prefix for a model or a metric with ID `card-id`."
  [card-id]
  (str "c" card-id "/"))

(defn query-field-id-prefix
  "Return the field ID prefix for `query-id`."
  [query-id]
  (str "q" query-id "/"))

(def any-prefix-pattern
  "A prefix pattern accepting columns from any entity."
  #"^.*/(\d+)")

(defn ->result-column
  "Return tool result columns for `column` of `query`. The position of `column` is determined by `index`.
  The ID is then generated by prefixing the position with `field-id-prefix`."
  [query column index field-id-prefix]
  (let [semantic-type (some-> (:semantic-type column) name u/->snake_case_en)]
    (-> {:field-id (str field-id-prefix index)
         :name (lib/display-name query column)
         :type (convert-field-type column)}
        (m/assoc-some :description (:description column)
                      :semantic-type semantic-type
                      :field-values (:field-values column)
                      :table-reference (:table-reference column)))))

(defn resolve-column-index
  "Resolve the reference `field_id` to the index of the result columns in the entity with `field-id-prefix`."
  [field-id field-id-prefix]
  (if (string? field-id-prefix)
    (if (str/starts-with? field-id field-id-prefix)
      (-> field-id (subs (count field-id-prefix)) parse-long)
      (throw (ex-info (str "field " field-id " not found") {:agent-error? true
                                                            :expected-prefix field-id-prefix})))
    (if-let [id-str (when (instance? java.util.regex.Pattern field-id-prefix)
                      (-> (re-matches field-id-prefix field-id)
                          second))]
      (parse-long id-str)
      (throw (ex-info (str "invalid field_id " field-id " for prefix " field-id-prefix)
                      {:agent-error? true
                       :expected-prefix (str field-id-prefix)
                       :field-id field-id})))))

(defn resolve-column
  "Resolve the reference `field-id` in filter `item` by finding the column in `columns` specified by `field-id`.
  `field-id-prefix` is used to check if the filter refers to a column from the right entity."
  [{:keys [field-id] :as item} field-id-prefix columns]
  (let [index (resolve-column-index field-id field-id-prefix)]
    (assoc item :column (nth columns index))))

(defn get-table
  "Get the `fields` of the table with ID `id`."
  [id & fields]
  (-> (t2/select-one (into [:model/Table :id] fields) id)
      api/read-check))

(defn get-card
  "Retrieve the card with `id` from the app DB."
  [id]
  (-> (t2/select-one :model/Card :id id)
      api/read-check))

(defn card-query
  "Return a query based on the model with ID `model-id`."
  [card-id]
  (when-let [card (get-card card-id)]
    (let [mp (lib.metadata.jvm/application-database-metadata-provider (:database_id card))]
      (lib/query mp (cond-> (lib.metadata/card mp card-id)
                      ;; pivot questions have strange result-columns so we work with the dataset-query
                      (#{:question} (:type card)) (get :dataset-query))))))

(defn metric-query
  "Return a query based on the model with ID `model-id`."
  [metric-id]
  (when-let [card (get-card metric-id)]
    (let [mp (lib.metadata.jvm/application-database-metadata-provider (:database_id card))]
      (lib/query mp (lib.metadata/metric mp metric-id)))))

(defn table-query
  "Return a query based on the table with ID `table-id`."
  [table-id]
  (when-let [table (get-table table-id :db_id)]
    (let [mp (lib.metadata.jvm/application-database-metadata-provider (:db_id table))]
      (lib/query mp (lib.metadata/table mp table-id)))))

(defn metabot-scope-query
  "Return the metric and model cards in metabot scope visible to the current user.

  If provided, the filter clause `metabot-entity-condition` is used to filter the metabot_entity table. The clause can
  refer to that table using the :mbe alias. The cards are returned with an additional field called :metabot_entity_id
  containing the ID of the metabot entity that brought the card in scope. (Situations in which several metabot
  entities can bring a card into scope is not supported. It is expected that at some point this query will be extended
  to deal with tables as well.)

  For example,
    [:in [:mbe.id [1 7 42]]] can be used to consider only specific entities,
    [:= :mbe.metabot_id 1]   can be used to consider only entities of metabot 1."
  ([]
   (metabot-scope-query nil))
  ([metabot-entity-condition]
   {:select [:*]
    :from   [[{:union-all
               [{:select [:card.* [:mbe.id :metabot_entity_id]]
                 :from   [[:report_card :card]]
                 :join   [[:metabot_entity :mbe] (cond-> [:and [:= :mbe.model [:inline "collection"]]]
                                                   metabot-entity-condition (conj metabot-entity-condition))
                          [:collection :ecoll]   [:= :ecoll.id :mbe.model_id]
                          [:collection :coll]    [:or
                                                  [:= :coll.id :ecoll.id]
                                                  [:like :coll.location [:concat :ecoll.location :ecoll.id [:inline "/%"]]]]]
                 :where  [:= :card.collection_id :coll.id]}
                {:select [:card.* [:mbe.id :metabot_entity_id]]
                 :from   [[:report_card :card]]
                 :join   [[:metabot_entity :mbe] (cond-> [:and
                                                          [:in :mbe.model [:inline ["dataset"  "metric"]]]]
                                                   metabot-entity-condition (conj metabot-entity-condition))]
                 :where  [:= :card.id :mbe.model_id]}]}
              :card]]
    :where  [:and
             [:in :card.type [:inline ["metric" "model"]]]
             [:= :card.archived false]
             ;; check that the current user can see the card
             (collection/visible-collection-filter-clause :card.collection_id)]}))

(comment
  (binding [api/*current-user-id* 2
            api/*is-superuser?* true]
    (t2/select-fn-vec #(select-keys % [:id :name :type :metabot_entity_id])
                      :model/Card
                      (metabot-scope-query [:= :mbe.metabot_id 1])))
  -)

(defn get-metrics-and-models
  "Retrieve the metric and model cards for the Metabot instance with ID `metabot-id` from the app DB.

  Only card visible to the current user are returned."
  [metabot-id]
  (let [scope-query (metabot-scope-query [:= :mbe.metabot_id metabot-id])]
    (t2/select :model/Card {:select   [:card.*]
                            :from     [[scope-query :card]]
                            :order-by [:card.id]})))

(defn metabot-scope
  "Return a map from cards (models or metrics) to the ID of metabot entity they belong to.

  Warning: this function assumes that each card is bought by one entity into scope. This assumption holds
  in the known special cases when there is but one collection entity, or when there are only dataset (model)
  and metric type entities."
  [entity-ids]
  (when (seq entity-ids)
    (let [cards (t2/select :model/Card
                           (metabot-scope-query [:in :mbe.id entity-ids]))]
      (reduce (fn [m c]
                (assoc m (dissoc c :metabot_entity_id) (:metabot_entity_id c)))
              {}
              cards))))
