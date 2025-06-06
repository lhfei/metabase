(ns metabase.parameters.shared-test
  (:require
   [clojure.test :as t]
   [metabase.parameters.shared :as params]))

(defn- tag-names
  [text]
  (let [result (params/tag_names text)]
    #?(:clj result
       :cljs (set (js->clj result)))))

(t/deftest ^:parallel parse-tag-names-test
  (t/testing "Tag names are correctly parsed from text card contents"
    (t/are [text tags] (= tags (tag-names text))
      ;; Valid tags
      "{{foo}}"           #{"foo"}
      "{{ foo }}"         #{"foo"}
      "{{ Foo.123_ }}"    #{"Foo.123_"}
      "{{ 123 }}"         #{"123"}
      "{{{{foo}}}"        #{"foo"}
      "{{foo}} {{bar}}"   #{"foo" "bar"}
      "{{foo}} {{foo}}"   #{"foo"}
      "{{foo}} {{Foo}}"   #{"foo" "Foo"}
      "{{foo}} {{ foo }}" #{"foo"}
      "{{foo}} bar"       #{"foo"}
      "{{foo {{bar}}"     #{"bar"}
      "{{foo {{bar}}}}"   #{"bar"}
      ;; Invalid or no tags
      ""                  #{}
      "foo"               #{}
      "{}"                #{}
      "{{}}"              #{}
      "{{ }}"             #{}
      "{{foo"             #{}
      "foo}}"             #{}
      "{foo}"             #{}
      "{{foo}"            #{}
      "{{*foo*}}"         #{}
      "{{&()'}}"          #{})))

(t/deftest ^:parallel substitute-tags-test
  (t/testing "Tags are correctly substituted into card text, and formatted appropriately based on their type"
    (t/are [text tag->param expected] (= expected (params/substitute-tags text tag->param))
      "{{foo}}"
      {"foo" {:type :string/= :value "bar"}}
      "bar"

      "{{foo}}"
      {"foo" {:type :string/= :value ["bar"]}}
      "bar"

      "{{foo}}"
      {"foo" {:type :string/= :value ["bar", "baz"]}}
      "bar and baz"

      "{{foo}}"
      {"foo" {:type :string/= :value ["bar", "baz", "qux"]}}
      "bar\\, baz\\, and qux"

      "{{foo}} and {{bar}}"
      {"foo" {:type :string/= :value "A"}
       "bar" {:type :string/= :value "B"}}
      "A and B"

      "{{foo}} and {{foo}}"
      {"foo" {:type :string/= :value "A"}
       "bar" {:type :string/= :value "B"}}
      "A and A"

      ;; All string types are substituted as simple values, regardless of operator
      "{{foo}}"
      {"foo" {:type :string/does-not-contain :value ["bar"]}}
      "bar"

      "{{foo}}"
      {"foo" {:type :number/= :value 1}}
      "1"

      "{{foo}}"
      {"foo" {:type :number/= :value [1]}}
      "1"

      "{{foo}}"
      {"foo" {:type :number/= :value [1 2 3]}}
      "1\\, 2\\, and 3"

      "{{foo}}"
      {"foo" {:type :number/= :value [1 2 3 4]}}
      "1\\, 2\\, 3\\, and 4"

      "{{foo}}"
      {"foo" {:type :number/between :value [1 5]}}
      "1 and 5"

      "{{foo}}"
      {"foo" {:type :id :value "1"}}
      "1"

      "{{foo}}"
      {"foo" {:type :date/relative :value "today"}}
      "Today"

      "{{foo}}"
      {"foo" {:type :date/relative :value "past7days"}}
      "Previous 7 days"

      "{{foo}}"
      {"foo" {:type :date/relative :value "past30days-from-7days"}}
      "Previous 30 days\\, starting 7 days ago"

      "{{foo}}"
      {"foo" {:type :date/relative :value "next10weeks-from-4weeks"}}
      "Next 10 weeks\\, starting 4 weeks from now"

      "{{foo}}"
      {"foo" {:type :date/relative :value "thismonth"}}
      "This month"))

  (t/testing "Special characters (with semantic meaning in Markdown) are escaped in formatted values"
    (t/are [text tag->param expected] (= expected (params/substitute-tags text tag->param))
      "{{foo}}"
      {"foo" {:type :string/= :value "*bar*"}}
      "\\*bar\\*"

      "{{foo}}"
      {"foo" {:type :string/= :value "<script>alert(1)</script>"}}
      "\\<script\\>alert\\(1\\)\\<\\/script\\>"

      ;; Characters in the original text are not escaped
      "_*{{foo}}*_"
      {"foo" {:type :string/= :value "*bar*"}}
      "_*\\*bar\\**_"))

  (t/testing "Special characters (with semantic meaning in Markdown) are not escaped in formatted values when escape-markdown is set to true"
    (t/are [text tag->param expected] (= expected (params/substitute-tags text tag->param "en" false))
      "{{foo}}"
      {"foo" {:type :string/= :value "*bar*"}}
      "*bar*"

      "{{foo}}"
      {"foo" {:type :string/= :value "<script>alert(1)</script>"}}
      "<script>alert(1)</script>"

        ;; Characters in the original text are not escaped
      "_*{{foo}}*_"
      {"foo" {:type :string/= :value "*bar*"}}
      "_**bar**_"))

  (t/testing "No substitution is done when no parameter is provided, or the parameter is invalid"
    (t/are [text tag->param expected] (= expected (params/substitute-tags text tag->param))
      ;; Nil input
      nil
      {}
      nil

      ;; No parameters
      "{{foo}}"
      {}
      "{{foo}}"

      ;; No parameter with matching name
      "{{foo}}"
      {"bar" {:type :string/= :value nil}}
      "{{foo}}"

      ;; Parameter with nil value
      "{{foo}}"
      {"foo" {:type :string/= :value nil}}
      "{{foo}}"

      ;; Parameter with no value
      "{{foo}}"
      {"foo" {:type :string/=}}
      "{{foo}}"

      ;; Parameter with no type: stringify the value with no additional formatting
      "{{foo}}"
      {"foo" {:value "today"}}
      "today")))

(t/deftest ^:parallel substitute-tags-date-filters
  (t/testing "Basic date values are formatted correctly"
    (t/are [text tag->param expected] (= expected (params/substitute-tags text tag->param))
      "{{foo}}"
      {"foo" {:type :date/single :value "2022-07-09"}}
      "July 9\\, 2022"

      "{{foo}}"
      {"foo" {:type :date/range :value "2022-07-06~2022-07-09"}}
      "July 6\\, 2022 \\- July 9\\, 2022"

      "{{foo}}"
      {"foo" {:type :date/month-year :value "2022-07"}}
      "July\\, 2022"

      "{{foo}}"
      {"foo" {:type :date/quarter-year :value "Q2-2022"}}
      "Q2\\, 2022"

      "{{foo}}"
      {"foo" {:type :date/all-options :value "~2022-07-09"}}
      "Before July 9\\, 2022"

      "{{foo}}"
      {"foo" {:type :date/all-options :value "2022-07-09~"}}
      "After July 9\\, 2022"

      "{{foo}}"
      {"foo" {:type :date/all-options :value "2022-07-09"}}
      "On July 9\\, 2022"

      "{{foo}}"
      {"foo" {:type :date/all-options :value "2022-07-06~2022-07-09"}}
      "July 6\\, 2022 \\- July 9\\, 2022"))

  (t/testing "Exclude options are formatted correctly"
    (t/are [text tag->param expected] (= expected (params/substitute-tags text tag->param))
      "{{foo}}"
      {"foo" {:type :date/all-options :value "exclude-months-Jul"}}
      "Exclude July"

      "{{foo}}"
      {"foo" {:type :date/all-options :value "exclude-months-Dec"}}
      "Exclude December"

      "{{foo}}"
      {"foo" {:type :date/all-options :value "exclude-months-Dec-Sep"}}
      "Exclude December\\, September"

      "{{foo}}"
      {"foo" {:type :date/all-options :value "exclude-months-Dec-Sep-Jul"}}
      "Exclude 3 selections"

      "{{foo}}"
      {"foo" {:type :date/all-options :value "exclude-hours-0"}}
      "Exclude 12 AM"

      "{{foo}}"
      {"foo" {:type :date/all-options :value "exclude-hours-0-14"}}
      "Exclude 12 AM\\, 2 PM"

      "{{foo}}"
      {"foo" {:type :date/all-options :value "exclude-hours-0-14-16"}}
      "Exclude 3 selections"

      "{{foo}}"
      {"foo" {:type :date/all-options :value "exclude-days-Mon"}}
      "Exclude Monday"

      "{{foo}}"
      {"foo" {:type :date/all-options :value "exclude-days-Wed-Fri"}}
      "Exclude Wednesday\\, Friday"

      "{{foo}}"
      {"foo" {:type :date/all-options :value "exclude-days-Tue-Sat-Sun"}}
      "Exclude 3 selections"

      "{{foo}}"
      {"foo" {:type :date/all-options :value "exclude-quarters-1"}}
      "Exclude Q1"

      "{{foo}}"
      {"foo" {:type :date/all-options :value "exclude-quarters-2-3"}}
      "Exclude Q2\\, Q3"

      "{{foo}}"
      {"foo" {:type :date/all-options :value "exclude-quarters-2-1-4"}}
      "Exclude 3 selections"))

  (t/testing "Relative date values are formatted correctly"
    (t/are [text tag->param expected] (= expected (params/substitute-tags text tag->param))
      "{{foo}}"
      {"foo" {:type :date/all-options :value "thisday"}}
      "Today"

      "{{foo}}"
      {"foo" {:type :date/all-options :value "thisweek"}}
      "This week"

      "{{foo}}"
      {"foo" {:type :date/all-options :value "past1days"}}
      "Yesterday"

      "{{foo}}"
      {"foo" {:type :date/all-options :value "next1days"}}
      "Tomorrow"

      "{{foo}}"
      {"foo" {:type :date/all-options :value "past1weeks"}}
      "Previous week"

      "{{foo}}"
      {"foo" {:type :date/all-options :value "next1quarters"}}
      "Next quarter"

      "{{foo}}"
      {"foo" {:type :date/all-options :value "past60minutes"}}
      "Previous 60 minutes"

      "{{foo}}"
      {"foo" {:type :date/all-options :value "next5years"}}
      "Next 5 years"))

  (t/testing "Date values are formatted using the locale passed in as an argument"
    (t/are [text tag->param expected] (= expected (params/substitute-tags text tag->param "es" true))
      "{{foo}}"
      {"foo" {:type :date/single :value "2022-07-09"}}
      "julio 9\\, 2022"

      "{{foo}}"
      {"foo" {:type :date/range :value "2022-01-06~2022-04-09"}}
      "enero 6\\, 2022 \\- abril 9\\, 2022"

      "{{foo}}"
      {"foo" {:type :date/month-year :value "2019-08"}}
      "agosto\\, 2019")))

(t/deftest ^:parallel substitute-tags-optional-blocks-test
  (t/testing "Optional blocks are removed when necessary"
    (t/are [text tag->param expected] (= expected (params/substitute-tags text tag->param))
      "[[{{foo}}]]"
      {}
      ""

      "[[{{foo}}]]"
      {"foo" {:type :string/= :value "bar"}}
      "bar"

      "Customers[[ with over {{order_count}} orders]]"
      {"order_count" {:type :number/= :value nil}}
      "Customers"

      "Customers[[ with over {{order_count}} orders]]"
      {"order_count" {:type :number/= :value 10}}
      "Customers with over 10 orders"

      ;; Optional block is retained when *any* parameters within are substituted
      "[[{{foo}} {{baz}}]]"
      {"foo" {:type :string/= :value "bar"}}
      "bar {{baz}}"

      ;; Make sure `join-consecutive-strings` retains consecutive non-strings (this was a bug during implementation)
      "[[{{foo}}{{foo}}]]"
      {"foo" {:type :string/= :value "foo"}}
      "foofoo"

      "[[{{foo}}]] [[{{bar}}]]"
      {"foo" {:type :string/= :value 1} "bar" {:type :string/= :value 2}}
      "1 2"

      "[[{{foo}}]"
      {"foo" {:type :string/= :value "bar"}}
      "[[bar]"

      "[{{foo}}]]"
      {"foo" {:type :string/= :value "bar"}}
      "[bar]]"

      ;; Don't strip square brackets that are in parameter values
      "{{foo}}"
      {"foo" {:type :string/= :value "[[bar]]"}}
      "\\[\\[bar\\]\\]")))

(t/deftest ^:parallel value-string-test
  (let [parameters [{:name "State",
                     :slug "state",
                     :id "63e719d0",
                     :default ["CA", "NY", "NJ"],
                     :type "string/=",
                     :sectionId "location"}
                    {:name "Quarter and Year",
                     :slug "quarter_and_year",
                     :id "a6db3d8b",
                     :default "Q1-2021"
                     :type "date/quarter-year",
                     :sectionId "date"}
    ;; Filter without default, should not be included in subscription
                    {:name "Product title contains",
                     :slug "product_title_contains",
                     :id "acd0dfab",
                     :type "string/contains",
                     :sectionId "string"}]]
    (t/testing "If a filter has multiple values, they are concatenated into a comma-separated string"
      (t/is (= "CA, NY, and NJ"
               (params/value-string (first parameters) "en"))))

    (t/testing "If a filter has a single default value, it is formatted appropriately"
      (t/is (= "Q1, 2021"
               (params/value-string (second parameters) "en"))))))

(t/deftest param-val-or-default-test
  (let [param-val-or-default #'params/param-val-or-default]
    (t/testing "When the parameter’s :value key is missing, fallback to the :default key"
      (t/is (= "my default value"
               (param-val-or-default {:default "my default value"}))))
    (t/testing "When the parameter’s :value is explicitly nil (i.e. for no-op filters), do not fallback to the :default key"
      (t/is (nil? (param-val-or-default {:value nil :default "my default value"}))))))

(t/deftest ^:parallel value-string-contains-test
  (t/testing "string/contains parameters are correctly formatted"
    (let [format-param (fn [default] (params/value-string {:name "State",
                                                           :slug "state",
                                                           :id "63e719d0",
                                                           :default default,
                                                           :type "string/contains",
                                                           :sectionId "location"}
                                                          "en"))]
      (t/is (= "contains CA"
               (format-param ["CA"])))
      (t/is (= "contains CA or NY"
               (format-param ["CA" "NY"])))
      (t/is (= "contains CA, NY, or NJ"
               (format-param ["CA" "NY" "NJ"]))))))
