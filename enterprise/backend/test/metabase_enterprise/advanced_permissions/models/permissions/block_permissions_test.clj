(ns metabase-enterprise.advanced-permissions.models.permissions.block-permissions-test
  (:require
   [clojure.test :refer :all]
   [metabase.models.interface :as mi]
   [metabase.permissions.core :as perms]
   [metabase.permissions.models.data-permissions :as data-perms]
   [metabase.permissions.models.data-permissions.graph :as data-perms.graph]
   [metabase.permissions.models.permissions-group :as perms-group]
   [metabase.query-processor :as qp]
   [metabase.query-processor.middleware.permissions :as qp.perms]
   [metabase.test :as mt]
   [metabase.util :as u]
   [toucan2.core :as t2]))

;;;; Graph-related stuff

(defn- test-db-perms [group-id]
  (get-in (data-perms.graph/api-graph) [:groups group-id (mt/id) :view-data]))

(defn- api-test-db-perms [group-id]
  (not-empty
   (into {}
         (map (fn [[k v]]
                [k (cond-> v (string? v) keyword)]))
         (get-in (mt/user-http-request :crowberto :get 200 "permissions/graph")
                 [:groups group-id (mt/id) :view-data]))))

(deftest graph-test
  (testing "block permissions are ellided from the graph"
    (doseq [[message perms] {"the graph function"
                             test-db-perms

                             "the API"
                             api-test-db-perms}]
      (testing (str message "\n"))
      (mt/with-temp [:model/PermissionsGroup {group-id :id} {}]
        (data-perms/set-database-permission! group-id (mt/id) :perms/view-data :blocked)
        (is (nil? (perms group-id)))))))

(defn- grant-block-perms! [group-id]
  (data-perms.graph/update-data-perms-graph!
   (-> (data-perms.graph/api-graph)
       (assoc-in [:groups group-id (mt/id) :view-data] :blocked)
       (assoc-in [:groups group-id (mt/id) :create-queries] :no))))

(defn- api-grant-block-perms! [group-id]
  (let [current-graph (data-perms.graph/api-graph)
        new-graph     (assoc-in current-graph [:groups group-id (mt/id) :view-data] :blocked)
        result        (mt/with-premium-features #{:advanced-permissions}
                        (mt/user-http-request :crowberto :put 200 "permissions/graph" new-graph))]
    (is (nil? (get-in result [:groups group-id (mt/id) :view-data])))))

(deftest api-throws-error-if-premium-feature-not-enabled
  (testing "PUT /api/permissions/graph"
    (testing (str "fails when a group has a block permission set, and the instance doesn't have the "
                  ":advanced-permissions premium feature enabled")
      (mt/with-temp [:model/PermissionsGroup {group-id :id}]
        ;; Revoke native perms so that we can set block perms
        (data-perms/set-database-permission! group-id (mt/id) :perms/create-queries :query-builder)
        (let [current-graph (data-perms.graph/api-graph)
              new-graph     (assoc-in current-graph [:groups group-id (mt/id) :view-data] :blocked)
              result        (mt/with-premium-features #{} ; disable premium features
                              (mt/user-http-request :crowberto :put 402 "permissions/graph" new-graph))]
          (is (= "The blocked permissions functionality is only enabled if you have a premium token with the advanced-permissions feature."
                 result)))))))

(deftest update-graph-test
  (testing "Should be able to set block permissions with"
    (doseq [[description grant!] {"the graph update function"
                                  (fn [group-id]
                                    (mt/with-premium-features #{:advanced-permissions}
                                      (grant-block-perms! group-id)))

                                  "the perms graph API endpoint"
                                  api-grant-block-perms!}]
      (testing (str description "\n")
        (mt/with-temp [:model/PermissionsGroup {group-id :id}]
          (testing "Group should have unrestricted view-data perms upon creation"
            (is (= :unrestricted
                   (test-db-perms group-id)))
            ; Revoke native perms so that we can set block perms
            (data-perms/set-database-permission! group-id (mt/id) :perms/create-queries :query-builder)
            (testing "group has no existing permissions"
              (mt/with-restored-data-perms-for-group! group-id
                (grant! group-id)
                (is (nil? (test-db-perms group-id))))))
          (testing "group has existing data permissions... :block should remove them"
            (mt/with-restored-data-perms-for-group! group-id
              (data-perms/set-database-permission! group-id (mt/id) :perms/view-data :unrestricted)
              (grant! group-id)
              (is (nil? (test-db-perms group-id)))
              (is (= #{:blocked}
                     (t2/select-fn-set :perm_value
                                       :model/DataPermissions
                                       {:where [:and
                                                [:= :db_id (mt/id)]
                                                [:= :group_id group-id]
                                                [:= :perm_type (u/qualified-name :perms/view-data)]]}))))))))))

(deftest update-graph-delete-sandboxes-test
  (testing "When setting `:blocked` permissions any GTAP rows for that Group/Database should get deleted."
    (mt/with-premium-features #{:sandboxes :advanced-permissions}
      (mt/with-model-cleanup [:model/Permissions]
        (mt/with-temp [:model/PermissionsGroup       {group-id :id} {}
                       :model/GroupTableAccessPolicy _ {:table_id (mt/id :venues)
                                                        :group_id group-id}]
          (grant-block-perms! group-id)
          (is (nil? (test-db-perms group-id)))
          (is (not (t2/exists? :model/GroupTableAccessPolicy :group_id group-id))))))))

(deftest update-graph-data-perms-should-delete-block-perms-test
  (testing "granting data permissions for a table should not delete existing block permissions"
    (mt/with-temp [:model/PermissionsGroup {group-id :id} {}]
      (data-perms/set-database-permission! group-id (mt/id) :perms/view-data :blocked)
      (is (nil? (test-db-perms group-id)))
      (data-perms/set-table-permission! group-id (mt/id :venues) :perms/view-data :unrestricted)
      (is (= {"PUBLIC" {(mt/id :venues) :unrestricted}}
             (test-db-perms group-id))))))

(deftest update-graph-disallow-native-query-perms-test
  (testing "Disallow block permissions + native query permissions"
    (mt/with-temp [:model/PermissionsGroup {group-id :id} {}]
      (testing "via the fn"
        (is (thrown-with-msg?
             clojure.lang.ExceptionInfo
             #"Invalid DB permissions: If you have write access for native queries, you must have data access to all schemas."
             (data-perms.graph/update-data-perms-graph! [group-id (mt/id)] {:view-data :blocked
                                                                            :create-queries :query-builder-and-native}))))
      (testing "via the API"
        (let [current-graph (data-perms.graph/api-graph)
              new-graph     (assoc-in current-graph
                                      [:groups group-id (mt/id)]
                                      {:view-data :blocked :create-queries :query-builder-and-native})]
          (is (=? #"Cannot parse permissions graph because it is invalid.*"
                  (mt/with-premium-features #{:advanced-permissions}
                    (mt/user-http-request :crowberto :put 400 "permissions/graph" new-graph)))))))))

(deftest delete-database-delete-block-perms-test
  (testing "If a Database gets DELETED, any block permissions for it should get deleted too."
    (mt/with-temp [:model/Database    {db-id :id} {}]
      (data-perms/set-database-permission! (u/the-id (perms-group/all-users)) db-id :perms/view-data :blocked)
      (letfn [(perms-exist? []
                (t2/exists? :model/DataPermissions :db_id db-id :perm_value :blocked))]
        (is (perms-exist?))
        (t2/delete! :model/Database :id db-id)
        (is (not (perms-exist?)))))))

;;;; QP perms-check related stuff.

(deftest qp-block-permissions-test
  (mt/with-temp-copy-of-db
    (let [query {:database (mt/id)
                 :type     :query
                 :query    {:source-table (mt/id :venues)
                            :limit        1}}]
      (mt/with-temp [:model/User                       {user-id :id} {}
                     :model/PermissionsGroup           {group-id :id} {}
                     :model/Collection                 {collection-id :id} {}
                     :model/Card                       {card-id :id} {:collection_id collection-id
                                                                      :dataset_query query}
                     :model/Permissions                _ {:group_id group-id :object (perms/collection-read-path collection-id)}]
        (perms/add-user-to-group! user-id group-id)
        (mt/with-premium-features #{:advanced-permissions}
          (mt/with-no-data-perms-for-all-users!
            (data-perms/set-database-permission! (perms-group/all-users) (mt/id) :perms/view-data :unrestricted)
            (data-perms/set-database-permission! (perms-group/all-users) (mt/id) :perms/create-queries :no)
            (data-perms/set-database-permission! group-id (mt/id) :perms/view-data :unrestricted)
            (data-perms/set-database-permission! group-id (mt/id) :perms/create-queries :no)
            (letfn [(run-ad-hoc-query []
                      (mt/with-current-user user-id
                        (qp/process-query query)))
                    (run-saved-question []
                      (binding [qp.perms/*card-id* card-id]
                        (run-ad-hoc-query)))
                    (check-block-perms []
                      (mt/with-current-user user-id
                        (#'qp.perms/check-block-permissions query)))]
              (testing "sanity check: should not be able to run ad-hoc query"
                (is (thrown-with-msg?
                     clojure.lang.ExceptionInfo
                     #"You do not have permissions to run this query"
                     (run-ad-hoc-query))))
              (testing "sanity check: should be able to run query as saved Question before block perms are set."
                (is (run-saved-question))
                (is (true? (check-block-perms))))
              ;; 'grant' the block permissions.
              (testing "the highest permission level from any group wins (block doesn't override other groups anymore)"
                (data-perms/set-database-permission! group-id (mt/id) :perms/view-data :blocked)
                (testing "if EE token does not have the `:advanced-permissions` feature: should not do check"
                  (mt/with-premium-features #{}
                    (is (nil? (check-block-perms)))))
                (testing "should still not be able to run ad-hoc query"
                  (is (thrown-with-msg?
                       clojure.lang.ExceptionInfo
                       #"You do not have permissions to run this query"
                       (run-ad-hoc-query))))
                (testing "should STILL be able to run query as saved Question"
                  (is (run-saved-question))
                  (is (true? (check-block-perms)))))
              (testing "once blocked in all groups, now access is truly blocked"
                (data-perms/set-database-permission! (perms-group/all-users) (mt/id) :perms/view-data :blocked)
                (testing "disallow running the query"
                  (is (thrown-with-msg?
                       clojure.lang.ExceptionInfo
                       #"You do not have permissions to run this query"
                       (check-block-perms)))
                  (is (thrown-with-msg?
                       clojure.lang.ExceptionInfo
                       #"You do not have permissions to run this query"
                       (run-saved-question))))))))))))

(deftest legacy-no-self-service-test
  (mt/with-temp-copy-of-db
    (let [query {:database (mt/id)
                 :type     :query
                 :query    {:source-table (mt/id :venues)
                            :limit        1}}]
      (mt/with-temp [:model/User                       {user-id :id} {}
                     :model/PermissionsGroup           {group-id :id} {}]
        (perms/add-user-to-group! user-id group-id)
        (mt/with-premium-features #{:advanced-permissions}
          (mt/with-no-data-perms-for-all-users!
            (testing "legacy-no-self-service does not override block perms for a table"
              (data-perms/set-database-permission! (perms-group/all-users) (mt/id) :perms/view-data :blocked)
              (data-perms/set-database-permission! (perms-group/all-users) (mt/id) :perms/create-queries :no)
              (data-perms/set-database-permission! group-id (mt/id) :perms/view-data :legacy-no-self-service)
              (data-perms/set-database-permission! group-id (mt/id) :perms/create-queries :no)
              (is (thrown-with-msg?
                   clojure.lang.ExceptionInfo
                   #"You do not have permissions to run this query"
                   (mt/with-current-user user-id
                     (#'qp.perms/check-block-permissions query)))))

            (testing "unrestricted overrides block perms for a table even if other tables have legacy-no-self-service"
              (data-perms/set-table-permission! group-id (mt/id :venues) :perms/view-data :unrestricted)
              (data-perms/set-table-permission! group-id (mt/id :orders) :perms/view-data :legacy-no-self-service)
              (is (true? (mt/with-current-user user-id
                           (#'qp.perms/check-block-permissions query)))))))))))

(deftest nested-query-full-block-permissions-test
  (mt/with-premium-features #{:advanced-permissions}
    (mt/with-non-admin-groups-no-root-collection-perms
      (mt/with-temp [:model/Collection disallowed-collection {}
                     :model/Card       parent-card           {:dataset_query {:database (mt/id)
                                                                              :type     :native
                                                                              :native   {:query "SELECT id FROM venues ORDER BY id ASC LIMIT 2;"}}
                                                              :database_id   (mt/id)
                                                              :collection_id (u/the-id disallowed-collection)}
                     :model/Collection allowed-collection    {}
                     :model/Card       child-card            {:dataset_query {:database (mt/id)
                                                                              :type     :query
                                                                              :query    {:source-table (format "card__%d" (u/the-id parent-card))}}
                                                              :collection_id (u/the-id allowed-collection)}]
        (letfn [(rasta-view-data-perm= [perm] (is (= perm
                                                     (get-in (data-perms/permissions-for-user (mt/user->id :rasta)) [(mt/id) :perms/view-data]))
                                                  "rasta should be blocked for this table."))]
          (mt/with-no-data-perms-for-all-users!
            (data-perms/set-database-permission! (perms-group/all-users) (mt/id) :perms/view-data :blocked)
            (perms/grant-collection-read-permissions! (perms-group/all-users) allowed-collection)
            (letfn [(process-query-for-card [card]
                      (mt/user-http-request :rasta :post (format "card/%d/query" (u/the-id card))))]
              (testing "Should be able to run a Card with another Card as its source query with just perms for the former (#15131)"
                (testing "Should not be able to run the parent Card"
                  (mt/with-test-user :rasta
                    (is (not (mi/can-read? disallowed-collection)))
                    (is (not (mi/can-read? parent-card))))
                  (is (= "You don't have permissions to do that."
                         (process-query-for-card parent-card))))
                (testing "Should not be able to run the child Card due to Block permissions"
                  (mt/with-test-user :rasta
                    (is (not (mi/can-read? parent-card)))
                    (is (mi/can-read? allowed-collection))
                    (is (mi/can-read? child-card)))
                  (rasta-view-data-perm= :blocked)
                  (testing "Data perms prohibit running queries"
                    (is (thrown-with-msg?
                         clojure.lang.ExceptionInfo
                         #"You do not have permissions to run this query"
                         (mt/rows (process-query-for-card child-card)))
                        "Even if the user has can-write? on a Card, they should not be able to run it because they are blocked on Card's db"))))
              (testing "view-data = unrestricted is required to allow running the query (#15131)"
                (mt/with-restored-data-perms!
                  (data-perms/set-database-permission! (perms-group/all-users) (mt/id) :perms/view-data :unrestricted)
                  (rasta-view-data-perm= :unrestricted)
                  (is (= [[1] [2]] (mt/rows (process-query-for-card child-card)))
                      "view-data = unrestricted is sufficient to allow running the query"))))))))))

;; Similar to the above test, but with table-level block in place for the nested query
(deftest nested-query-table-level-block-permissions-test
  (mt/with-premium-features #{:advanced-permissions}
    (mt/with-non-admin-groups-no-root-collection-perms
      (mt/with-temp [:model/Collection collection {}
                     :model/Card       parent-card           {:dataset_query {:database (mt/id)
                                                                              :type     :native
                                                                              :native   {:query "SELECT id FROM venues ORDER BY id ASC LIMIT 2;"}}
                                                              :database_id   (mt/id)
                                                              :collection_id (u/the-id collection)}
                     :model/Card       child-card            {:dataset_query {:database (mt/id)
                                                                              :type     :query
                                                                              :query    {:source-table (format "card__%d" (u/the-id parent-card))}}
                                                              :collection_id (u/the-id collection)}]
        (letfn [(rasta-view-data-perm= [perm] (is (= perm
                                                     (get-in (data-perms/permissions-for-user (mt/user->id :rasta))
                                                             [(mt/id) :perms/view-data (mt/id :venues)]))
                                                  "rasta should be blocked for this table."))]
          (mt/with-full-data-perms-for-all-users!
            (data-perms/set-table-permission! (perms-group/all-users) (mt/id :venues) :perms/view-data :blocked)
            (perms/grant-collection-read-permissions! (perms-group/all-users) collection)
            (letfn [(process-query-for-card [card]
                      (mt/user-http-request :rasta :post (format "card/%d/query" (u/the-id card))))]
              (mt/with-test-user :rasta
                (rasta-view-data-perm= :blocked)
                (testing "Should not be able to run the parent Card due to Block permissions"
                  (is (mi/can-read? parent-card))
                  (is (thrown-with-msg?
                       clojure.lang.ExceptionInfo
                       #"You do not have permissions to run this query"
                       (mt/rows (process-query-for-card child-card)))))

                (testing "Should not be able to run the child Card due to Block permissions"
                  (mt/with-test-user :rasta
                    (is (mi/can-read? parent-card))
                    (is (mi/can-read? collection))
                    (is (mi/can-read? child-card)))
                  (is (thrown-with-msg?
                       clojure.lang.ExceptionInfo
                       #"You do not have permissions to run this query"
                       (mt/rows (process-query-for-card child-card)))
                      "Even if the user has can-write? on a Card, they should not be able to run it because they are blocked on Card's db"))

                (testing "view-data = unrestricted is required to allow running the query"
                  (data-perms/set-table-permission! (perms-group/all-users) (mt/id :venues)  :perms/view-data :unrestricted)
                  (is (= [[1] [2]] (mt/rows (process-query-for-card child-card)))
                      "view-data = unrestricted is sufficient to allow running the query"))))))))))

(deftest cannot-run-any-native-queries-when-blocked-test
  (mt/with-premium-features #{:advanced-permissions}
    (mt/with-non-admin-groups-no-root-collection-perms
      (mt/with-temp [:model/Collection allowed-collection    {}
                     :model/Collection disallowed-collection {}
                     :model/Card       parent-card           {:dataset_query {:database (mt/id)
                                                                              :type     :native
                                                                              :native   {:query "SELECT id FROM venues ORDER BY id ASC LIMIT 2;"}}
                                                              :database_id   (mt/id)
                                                              :collection_id (u/the-id disallowed-collection)}
                     :model/Card       child-card            {:dataset_query {:database (mt/id)
                                                                              :type     :query
                                                                              :query    {:source-table (format "card__%d" (u/the-id parent-card))}}
                                                              :collection_id (u/the-id allowed-collection)}]
        (letfn [(process-query-for-card [card]
                  (mt/user-http-request :rasta :post (format "card/%d/query" (u/the-id card))))]
          (testing "Cannot run native queries when a single table is unrestricted and the rest are blocked"
            (mt/with-no-data-perms-for-all-users!
              (data-perms/set-database-permission! (perms-group/all-users) (mt/id) :perms/view-data :blocked)
              (data-perms/set-table-permission! (perms-group/all-users) (mt/id :venues) :perms/view-data :unrestricted)
              (perms/grant-collection-read-permissions! (perms-group/all-users) allowed-collection)
              (is (thrown-with-msg?
                   clojure.lang.ExceptionInfo
                   #"You do not have permissions to run this query"
                   (mt/rows (process-query-for-card child-card)))
                  "Someone with `:blocked` permissions on ANY table in the database cannot run ANY card with native queries, including as a source for another card.")))
          ;; update collection perms in place:
          (perms/revoke-collection-permissions! (perms-group/all-users) allowed-collection)
          (testing "Cannot run native queries when a single table is blocked and the rest are unrestricted"
            (mt/with-no-data-perms-for-all-users!
              (data-perms/set-database-permission! (perms-group/all-users) (mt/id) :perms/view-data :unrestricted)
              (data-perms/set-table-permission! (perms-group/all-users) (mt/id :venues) :perms/view-data :blocked)
              (perms/grant-collection-read-permissions! (perms-group/all-users) allowed-collection)
              (is (thrown-with-msg?
                   clojure.lang.ExceptionInfo
                   #"You do not have permissions to run this query"
                   (mt/rows (process-query-for-card child-card)))
                  "Someone with `:blocked` permissions on ANY table in the database cannot run ANY card with native queries, including as a source for another card."))))))))

(deftest native-queries-against-db-with-some-blocked-table-is-illegal-test
  (mt/with-premium-features #{:advanced-permissions}
    (mt/with-temp [:model/Card {card-id :id {db-id :database} :dataset_query} {:dataset_query (mt/native-query {:query "select 1"})}]
      (mt/with-no-data-perms-for-all-users!
        (data-perms/set-database-permission! (perms-group/all-users) db-id :perms/create-queries (data-perms/most-permissive-value :perms/create-queries))
        (data-perms/set-database-permission! (perms-group/all-users) db-id :perms/view-data (data-perms/most-permissive-value :perms/view-data))
        ;; rasta has access to the database:
        (is (= [[1]]
               (mt/rows (mt/user-http-request :rasta :post 202 (format "card/%d/query" card-id)))))

        ;; block a single table on the db:
        (let [tables-in-db (map :id (:tables (t2/hydrate (t2/select-one :model/Database db-id) :tables)))
              table-id (rand-nth tables-in-db)]
          (data-perms/set-table-permissions! (perms-group/all-users) :perms/view-data {table-id :blocked}))
        (is (thrown-with-msg?
             clojure.lang.ExceptionInfo
             #"You do not have permissions to run this query"
             (mt/rows (mt/user-http-request :rasta :post (format "card/%d/query" card-id)))))))))

(deftest native-sandboxes-still-block-other-joined-tables
  (mt/with-premium-features #{:advanced-permissions :sandboxes}
    (mt/with-no-data-perms-for-all-users!
      (mt/with-temp [:model/Card {card-id :id} {:dataset_query (mt/native-query {:query "SELECT ID FROM CHECKINS"})}
                     :model/GroupTableAccessPolicy _ {:group_id             (u/the-id (perms/all-users-group))
                                                      :table_id             (mt/id :checkins)
                                                      :card_id              card-id
                                                      :attribute_remappings {}}
                     :model/Card {query-card-id :id} {:dataset_query (mt/mbql-query checkins
                                                                       {:aggregation [[:count]]
                                                                        :joins       [{:source-table $$venues
                                                                                       :alias        "v"
                                                                                       :strategy     :left-join
                                                                                       :condition    [:= $venue_id &v.venues.id]}]})}]
        (data-perms/set-table-permissions! (perms-group/all-users) :perms/view-data {(mt/id 'venues) :blocked})
        (is (thrown-with-msg?
             clojure.lang.ExceptionInfo
             #"You do not have permissions to run this query"
             (mt/rows (mt/user-http-request :rasta :post (format "card/%d/query" query-card-id)))))))))
